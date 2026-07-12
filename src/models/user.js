import mongoose from "mongoose";

const userSchema=new mongoose.Schema(
  {
    user_name:{
      type:String,
      required:true,
      unique:true,
      trim:true
    },
    password:
    {
      type:String,
      trim:true,
      minLength:7
    },
    email_id:{
      type:String,
      required:true,
      unique:true,
      trim:true,
      lowercase:true,
      match:[/\S+@\S+\.\S+/,'Please fill a valid email address']
    },
    googleId:
    {
      type:String,
      unique:true,
      sparse:true
    }
    
  }
  ,{ timestamps: true }
);
export const User=mongoose.model("User",userSchema);