import mongoose, { mongo } from "mongoose";
mongoose.connect("mongodb://localhost:27017/kalshi");

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  usdBalance: {
    type: Number,
    default: 0,
  },
});

export const UserModel = mongoose.model("users", UserSchema);

const MarketSchema = new mongoose.Schema({
  title: String,
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

export const MarketModel = mongoose.model("market", MarketSchema);
