import jwt from "jsonwebtoken";

export const reqAuth=async(req,res,next)=>
{
  try{
    const authHeader=req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer "))
    {
      const err=new Error("Access Denied NO token was provided");
      err.statusCode=401;
      throw err;
    }
    const token=authHeader.split(" ")[1];
    const JWT_SECRET=process.env.JWT_SECRET|| "secret";
    const decoded=jwt.verify(token,JWT_SECRET);
    req.userId=decoded.userId;
    next();
  }
  catch(err)
  {
    res.status(err.statusCode|| 401).json({
      success:false,
      message:err.message || "Invalid or Expired Token"
    });

  }
};