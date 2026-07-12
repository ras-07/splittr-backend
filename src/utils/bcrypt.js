import bcrypt,{ compare } from "bcryptjs";
const saltRounds=10;
export const hashPassword=async (password)=>
{
  const salt=bcrypt.genSaltSync(saltRounds);
  return await bcrypt.hashSync(password,salt);
}

export const comparePassword=async (plain,hashedPassword)=>
{
  return await bcrypt.compareSync(plain,hashedPassword);
}