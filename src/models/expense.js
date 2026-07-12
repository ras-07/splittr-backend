import mongoose from "mongoose";

const addExpenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    },
    expense_name: {
      type: String,
      required: true,
      trim: true
    },
    expense_amt: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      enum: ["Food", "Travel", "Entertainment", "Lodging", "Others"],
      default: "Others" // Fallback option if none selected
    },
    paid_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    split_details: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        owedAmount: {
          type: Number,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", addExpenseSchema);