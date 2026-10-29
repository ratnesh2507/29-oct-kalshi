import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SignupSchema } from "./types";
import { UserModel } from "./schema";

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
  const { username, password } = req.body;

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

app.listen(3001);
