import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/kalshi");

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: {
    type: String,
    default: "user",
  },
  usdBalance: {
    type: Number,
    default: 0,
  },
  lockedUsdBalance: {
    type: Number,
    default: 0,
  },
});

export const UserModel = mongoose.model("users", UserSchema);

const MarketSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  title: String,
  totalIssued: {
    type: Number,
    default: 0,
  },
  resolution: {
    type: String,
    default: null,
  },
});

export const MarketModel = mongoose.model("markets", MarketSchema);

const OrderbookSchema = new mongoose.Schema({
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "markets",
  },
  type: String,
});

export const OrderbookModel = mongoose.model("orderbooks", OrderbookSchema);

const StockBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "markets",
  },
  type: String,
  qty: {
    type: Number,
    default: 0,
  },
  locked: {
    type: Number,
    default: 0,
  },
});

export const StockBalanceModel = mongoose.model(
  "stockBalances",
  StockBalanceSchema,
);

const BidSchema = new mongoose.Schema({
  orderbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orderbooks",
  },
  price: Number,
  qty: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  stockType: String,
});

export const BidModel = mongoose.model("bids", BidSchema);

const AskSchema = new mongoose.Schema({
  orderbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orderbooks",
  },
  price: Number,
  qty: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  stockType: String,
});

export const AskModel = mongoose.model("asks", AskSchema);

const FillSchema = new mongoose.Schema({
  orderbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orderbooks",
  },
  price: Number,
  qty: Number,
  type: String,
  isMaker: Boolean,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

export const FillModel = mongoose.model("fills", FillSchema);
