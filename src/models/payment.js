import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true // The person paying back their debt
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true // The person recovering their cash
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);