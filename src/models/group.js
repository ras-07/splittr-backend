import mongoose from "mongoose";
const grpSchema= new mongoose.Schema(
  {
    Group_name:
    {
      type:String,
      required:true,
      trim:true
    },
    Owner:
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",//ref: "User" defines a reference (or a relationship) between two different collections in your MongoDB database. 
      required:true
    },
    members:
    [
      {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
    ],
    balances: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        netBalance: {
          type: Number,
          default: 0 // e.g., -500 means they owe 500, +250 means they are owed 250
        }
      }
    ]
  },
  {timestamps:true}
);

export const Group=mongoose.model("Group",grpSchema);