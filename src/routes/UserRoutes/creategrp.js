import { Group } from "../../models/group.js";
import { Payment } from "../../models/payment.js";
import { reqAuth } from "../../middleware/authmiddleware.js";
import { Router } from "express";
import { User } from "../../models/user.js";
import { Expense } from "../../models/expense.js";

const grpRouter = Router();

// Create a group
grpRouter.post('/api/groups', reqAuth, async (req, res, next) => {
  try {
    const { Group_name, members } = req.body;
    if (!Group_name) {
      const err = new Error("GRP NAME IS REQUIRED");
      err.statusCode = 400;
      throw err;
    }
    const allmembers = members ? [...members] : [];
    if (!allmembers.includes(req.userId)) {
      allmembers.push(req.userId);
    }
    const initialBalances = allmembers.map(memberId => ({
      user: memberId,
      netBalance: 0
    }));
    const newGrp = new Group({
      Group_name: Group_name,
      Owner: req.userId,
      members: allmembers,
      balances: initialBalances
    });
    const savedGrp = await newGrp.save();
    res.status(201).json({
      success: true,
      message: "GROUP Created SUCCESSFULLY",
      data: savedGrp
    });
  } catch (err) {
    next(err);
  }
});

// Add multiple group members
grpRouter.post('/api/groups/:groupId/members', reqAuth, async (req, res, next) => {
  try {
    const { emails } = req.body;
    const { groupId } = req.params;
    if (!emails || !Array.isArray(emails) || emails.length == 0) {
      const err = new Error("An Valid Members Array of emails is reqd as I/P");
      err.statusCode = 400;
      throw err;
    }
    const group = await Group.findById(groupId);
    if (!group) {
      const err = new Error("Group Doesn't Exist");
      err.statusCode = 404;
      throw err;
    }
    if (!group.members.includes(req.userId)) {
      const err = new Error("Unauthorized You're not a member of the group");
      err.statusCode = 401;
      throw err;
    }
    const foundUsers = await User.find({ email_id: { $in: emails } });
    const registeredEmails = foundUsers.map(user => user.email_id.toLowerCase());
    const unregisteredEmails = emails.filter(email => !registeredEmails.includes(email.toLowerCase()));
    const addedUsers = [];
    const alreadyInGrp = [];
    
    foundUsers.forEach(user => {
      const inGrp = group.members.some(memberId => memberId.toString() === user._id.toString());
      if (!inGrp) {
        addedUsers.push(user.email_id);
        group.members.push(user._id);
        group.balances.push({
          user: user._id,
          netBalance: 0
        });
      } else {
        alreadyInGrp.push(user.email_id);
      }
    });
    
    if (addedUsers.length > 0) {
      await group.save();
    }
    res.status(200).json({
      success: true,
      message: "Group membership Processing Complete",
      results: {
        successfullyAdded: addedUsers,
        alreadyMembers: alreadyInGrp,
        accountDoesNotExist: unregisteredEmails
      },
      data: group
    });
  } catch (err) {
    next(err);
  }
});

// Get all groups that req.userId belongs to
grpRouter.get('/api/groups', reqAuth, async (req, res, next) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate("Owner", "user_name email_id")
      .populate("members", "user_name email_id")
      .populate("balances.user", "user_name email_id");
    res.status(200).json({
      success: true,
      message: "Fetching of Groups Completed Successfully",
      data: groups
    });
  } catch (err) {
    next(err);
  }
});

// Get a single group's details by ID
grpRouter.get('/api/groups/:groupId', reqAuth, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("Owner", "user_name email_id")
      .populate("members", "user_name email_id")
      .populate("balances.user", "user_name email_id");
      
    if (!group) {
      const err = new Error("Group not found");
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({
      success: true,
      message: "Group fetched successfully",
      data: group
    });
  } catch (err) {
    next(err);
  }
});

// 🗑️ Delete a group along with all its associated expenses and payments
grpRouter.delete('/api/groups/:groupId', reqAuth, async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      const err = new Error("Group not found");
      err.statusCode = 404;
      throw err;
    }

    // Security check: Only the group creator/owner can delete the group
    if (group.Owner.toString() !== req.userId.toString()) {
      const err = new Error("Unauthorized: Only the group owner can delete this group");
      err.statusCode = 401;
      throw err;
    }

    // Clean up dependent collections so you don't leave orphaned data in MongoDB
    await Expense.deleteMany({ group: groupId });
    await Payment.deleteMany({ group: groupId });
    
    // Remove the group itself
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      success: true,
      message: "Group and all associated history deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

// 🌟 Bulletproof route to settle debts between two group members
grpRouter.post('/api/groups/:groupId/settle', reqAuth, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { fromUser, toUser, amount } = req.body; // 🌟 Accept both explicitly

    if (!fromUser || !toUser || !amount || amount <= 0) {
      const error = new Error("Payer, receiver, and a positive amount are required.");
      error.statusCode = 400;
      throw error;
    }

    // Security check: The logged-in user must be involved in the settlement transaction
    if (req.userId.toString() !== fromUser.toString() && req.userId.toString() !== toUser.toString()) {
      const error = new Error("Unauthorized: You cannot log settlements for other users.");
      error.statusCode = 401;
      throw error;
    }

    const group = await Group.findById(groupId).populate("balances.user");
    if (!group) {
      const error = new Error("Group not found.");
      error.statusCode = 404;
      throw error;
    }

    const extractIdStr = (userField) => {
      if (!userField) return "";
      if (typeof userField === 'object') return (userField._id || userField).toString();
      return userField.toString();
    };

    const senderBalance = group.balances.find(b => extractIdStr(b.user) === fromUser.toString());
    const receiverBalance = group.balances.find(b => extractIdStr(b.user) === toUser.toString());

    if (!senderBalance || !receiverBalance) {
      const error = new Error("One or both users are not members of this group.");
      error.statusCode = 400;
      throw error;
    }

    // 🌟 Correct Splitwise Accounting Math:
    // Payer's debt gets cleared (moves up toward 0)
    senderBalance.netBalance += amount;   
    // Receiver's credit reduces (moves down toward 0)
    receiverBalance.netBalance -= amount; 

    const settlement = new Payment({
      group: groupId,
      fromUser,
      toUser,
      amount
    });

    await settlement.save();
    await group.save();

    res.status(201).json({
      success: true,
      message: "Settlement recorded successfully",
      data: settlement
    });
  } catch (err) {
    next(err);
  }
});
export default grpRouter;