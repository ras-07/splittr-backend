import { Expense } from "../../models/expense.js";
import { Group } from "../../models/group.js";
import { User } from "../../models/user.js";
import { Router } from "express";
import { reqAuth } from "../../middleware/authmiddleware.js";
import { updateGroupBalances } from "../balanceRoutes/balanceHelper.js";

const expRouter=Router();

expRouter.post('/api/exp/:groupId',reqAuth,async (req,res,next)=>
{
  let final_expense_details;
  try
  {
  const {groupId}=req.params;
  const {expense_name,expense_amt,category,split_details}=req.body;
  if(!expense_name ||expense_amt<=0)
  {
    const err= new Error("Expense details can't be empty and expense amt cant'be <=0");
    err.statusCode=400;
    throw err;
  } 
  const group=await Group.findById(groupId);
  if(!group)
  {
    const err=new Error("Group not found");
    err.statusCode=404;
    throw err;
  }
  if(!group.members.some(mId=> mId.toString() === req.userId.toString()))
  {
    const err=new Error("Unauthorized USer");
    err.statusCode=401;
    throw err;
  }
  if(split_details && Array.isArray(split_details) && split_details.length>0 )
  {
    if(typeof(split_details[0])=='object' && split_details[0].owedAmount!==undefined)
    {
      final_expense_details=split_details;
    }
    else{
      const amt_share=parseFloat((expense_amt/split_details.length).toFixed(2));
      final_expense_details=split_details.map(userId=>(
        {
          user:userId,
          owedAmount:amt_share
        }
      ));
    }
  }
  else{
    const amt_share=parseFloat((expense_amt/group.members.length).toFixed(2));
    final_expense_details=group.members.map(memberId=>(
        {
          user:memberId,
          owedAmount:amt_share
        }
      ));
  }
  const newExpense=new Expense(
    {
      group:groupId,
      expense_name,
      expense_amt,
      category:category|| "Others",
      paid_by:req.userId,
      split_details:final_expense_details
    }
  );
  await newExpense.save();
  await updateGroupBalances(groupId,newExpense);
  res.status(201).json({
      success: true,
      message: "Expense logged and group balances updated successfully",
      data: newExpense
    });

  } 
  catch (err) {
    next(err);
  }
});
// 🔍 Fetch all itemized transactions for a single group
expRouter.get('/api/exp/:groupId', reqAuth, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    
    // Find expenses matching this group and populate the user who paid
    const expenses = await Expense.find({ group: groupId })
      .populate("paid_by", "user_name email_id")
      .sort({ createdAt: -1 }); // Newest bills appear at the top

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (err) {
    next(err);
  }
});

export default expRouter; 