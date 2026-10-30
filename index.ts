import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SigninSchema, SignupSchema } from "./types";
import { UserModel, MarketModel, StockBalanceModel } from "./schema";
import { auth } from "./middleware/authMiddleware";

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

app.post("/market", auth, async (req, res) => {
  const { title } = req.body;

  const market = await MarketModel.create({
    title,
    creatorId: req.userId,
  });

  return res.status(200).json({
    id: market._id,
    title: market.title,
  });
});

app.post("/split", auth, async (req, res) => {
  const { marketId, amount } = req.body;

  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount % 100 !== 0
  ) {
    return res.status(400).json({
      message: "Amount must be a positive integer divisible by 100",
    });
  }

  const user = await UserModel.findById(req.userId);

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

  const qty = amount / 100;

  user.usdBalance -= amount;
  await user.save();

  const yesBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "YES",
  });

  if (yesBalance) {
    yesBalance.qty += qty;
    await yesBalance.save();
  } else {
    await StockBalanceModel.create({
      userId: user._id,
      marketId,
      type: "YES",
      qty,
    });
  }

  const noBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "NO",
  });

  if (noBalance) {
    noBalance.qty += qty;
    await noBalance.save();
  } else {
    await StockBalanceModel.create({
      userId: user._id,
      marketId,
      type: "NO",
      qty,
    });
  }

  market.totalIssued += qty;
  await market.save();

  return res.status(200).json({
    message: "Split successful",
  });
});

app.post("/merge", auth, async (req, res) => {
  const { marketId, amount } = req.body;

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a positive integer",
    });
  }

  const user = await UserModel.findById(req.userId);

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
    type: "YES",
  });

  if (!yesBalance || yesBalance.qty < amount) {
    return res.status(400).json({
      message: "Insufficient YES balance",
    });
  }

  const noBalance = await StockBalanceModel.findOne({
    userId: user._id,
    marketId,
    type: "NO",
  });

  if (!noBalance || noBalance.qty < amount) {
    return res.status(400).json({
      message: "Insufficient NO balance",
    });
  }

  yesBalance.qty -= amount;
  noBalance.qty -= amount;

  user.usdBalance += amount * 100;
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
