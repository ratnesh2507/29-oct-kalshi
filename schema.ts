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
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
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
    required: true,
  },
  type: {
    type: String,
    enum: ["YES", "NO"],
    required: true,
  },
});

OrderbookSchema.index({ marketId: 1, type: 1 }, { unique: true });

export const OrderbookModel = mongoose.model("orderbooks", OrderbookSchema);

const StockBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "markets",
    required: true,
  },
  type: {
    type: String,
    enum: ["YES", "NO"],
    required: true,
  },
  qty: {
    type: Number,
    default: 0,
  },
  locked: {
    type: Number,
    default: 0,
  },
});

StockBalanceSchema.index({ userId: 1, marketId: 1, type: 1 }, { unique: true });

export const StockBalanceModel = mongoose.model(
  "stockBalances",
  StockBalanceSchema,
);

const BidSchema = new mongoose.Schema(
  {
    orderbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orderbooks",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    remainingQty: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    stockType: {
      type: String,
      enum: ["YES", "NO"],
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "PARTIALLY_FILLED", "FILLED", "CANCELLED"],
      default: "OPEN",
    },
  },
  { timestamps: true },
);

export const BidModel = mongoose.model("bids", BidSchema);

const AskSchema = new mongoose.Schema(
  {
    orderbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orderbooks",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    remainingQty: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    stockType: {
      type: String,
      enum: ["YES", "NO"],
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "PARTIALLY_FILLED", "FILLED", "CANCELLED"],
      default: "OPEN",
    },
  },
  { timestamps: true },
);

export const AskModel = mongoose.model("asks", AskSchema);

const FillSchema = new mongoose.Schema({
  tradeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  orderbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orderbooks",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true,
  },
  isMaker: {
    type: Boolean,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

export const FillModel = mongoose.model("fills", FillSchema);
