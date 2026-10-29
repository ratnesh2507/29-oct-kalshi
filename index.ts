import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SigninSchema, SignupSchema } from "./types";
import { UserModel, MarketModel, StockBalanceModel } from "./schema";

const app = express();

app.use(express.json());

app.post("/signup", async (req, res) => {
  const { success, data } = SignupSchema.safeParse(req.body);

  if (!success) {
    res.status(411).json({ message: "Incorrect inputs" });
    return;
  }

  const userExists = await UserModel.findOne({
    username: data.username,
  });

  if (userExists) {
    res.status(412).json({
      message: "User already exists with this username",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const response = await UserModel.create({
    username: data.username,
    password: hashedPassword,
  });

  res.status(200).json({
    id: response._id,
  });
});

app.post("/signin", async (req, res) => {
  const { success, data } = SigninSchema.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }

  const { username, password } = data;
  const user = await UserModel.findOne({
    username,
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(403).json({
      message: "Invalid password",
    });
  }

  const token = jwt.sign(
    {
      userId: user._id,
    },
    "secret",
  );

  return res.status(200).json({
    token,
  });
});

app.post("/onramp", async (req, res) => {
  const { username, amount } = req.body;
  const user = await UserModel.findOne({
    username,
  });
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  user.usdBalance += amount;

  await user.save();

  return res.status(200).json({
    balance: user.usdBalance,
  });
});

app.post("/market", async (req, res) => {
  const { title } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const decoded = jwt.verify(token, "secret") as {
    userId: string;
  };
  const market = await MarketModel.create({
    title,
    creatorId: decoded.userId,
  });
  return res.status(200).json({
    id: market._id,
    title: market.title,
  });
});

app.post("/split", async (req, res) => {
  const { marketId, amount } = req.body;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const decoded = jwt.verify(token, "secret") as {
    userId: string;
  };
  const user = await UserModel.findById(decoded.userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }
  if (user.usdBalance < amount) {
    return res.status(400).json({
      message: "Insufficient balance",
    });
  }
  const market = await MarketModel.findById(marketId);

  if (!market) {
    return res.status(404).json({
      message: "Market not found",
    });
  }

  user.usdBalance -= amount;
  await user.save();

  const yesBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "yes",
  });
  if (yesBalance) {
    yesBalance.qty += amount;
    await yesBalance.save();
  } else {
    await StockBalanceModel.create({
      userId: user._id,
      marketId,
      type: "yes",
      qty: amount,
    });
  }
  const noBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "no",
  });
  if (noBalance) {
    noBalance.qty += amount;
    await noBalance.save();
  } else {
    await StockBalanceModel.create({
      userId: user._id,
      marketId,
      type: "no",
      qty: amount,
    });
  }
  market.totalIssued += amount;
  await market.save();

  return res.status(200).json({
    message: "Split successful",
  });
});

app.post("/merge", async (req, res) => {
  const { marketId, amount } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const decoded = jwt.verify(token, "secret") as {
    userId: string;
  };

  const user = await UserModel.findById(decoded.userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const market = await MarketModel.findById(marketId);

  if (!market) {
    return res.status(404).json({
      message: "Market not found",
    });
  }

  const yesBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "yes",
  });

  if (!yesBalance || yesBalance.qty < amount) {
    return res.status(400).json({
      message: "Insufficient YES balance",
    });
  }
  const noBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "no",
  });

  if (!noBalance || noBalance.qty < amount) {
    return res.status(400).json({
      message: "Insufficient NO balance",
    });
  }

  yesBalance.qty -= amount;
  noBalance.qty -= amount;

  user.usdBalance += amount;
  market.totalIssued -= amount;

  await user.save();
  await market.save();
  await yesBalance.save();
  await noBalance.save();

  return res.status(200).json({
    message: "Merge successful",
  });
});

app.get("/markets", async (req, res) => {
  const markets = await MarketModel.find();
  return res.status(200).json({
    markets,
  });
});

app.listen(3001);
