import { Group } from "../../models/group.js";

export const updateGroupBalances = async (groupId, expense) => {
  const group = await Group.findById(groupId);
  if (!group) return;

  const extractIdStr = (userField) => {
    if (!userField) return "";
    if (typeof userField === 'object') return (userField._id || userField).toString();
    return userField.toString();
  };

  // 1. Give credit to the person who paid the bill (+ Total Amount)
  const payerBalance = group.balances.find(
    (b) => extractIdStr(b.user) === expense.paid_by.toString()
  );
  if (payerBalance) {
    payerBalance.netBalance += expense.expense_amt;
  }

  // 2. Charge everyone who is involved in the split (- Owed Amount)
  expense.split_details.forEach((splitItem) => {
    const debtorBalance = group.balances.find(
      (b) => extractIdStr(b.user) === splitItem.user.toString()
    );
    if (debtorBalance) {
      // 🌟 FIX: Changed from invalid '--=' to correct '-=' operator
      debtorBalance.netBalance -= splitItem.owedAmount;
    }
  });

  // 3. Save the mutated group document back to MongoDB
  await group.save();
};