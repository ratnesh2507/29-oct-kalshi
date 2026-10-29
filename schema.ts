import mongoose from "mongoose";
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
