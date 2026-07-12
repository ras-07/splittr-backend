import { Router } from "express";
import { User } from "../../models/user.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { addUservalidnSchema } from "../../utils/validationschema.js";
import { checkSchema,validationResult,matchedData } from "express-validator";
import { hashPassword,comparePassword } from "../../utils/bcrypt.js";
import { OAuth2Client } from "google-auth-library";
import { reqAuth } from "../../middleware/authmiddleware.js";

const googleClient =new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



const userRouter=Router();

userRouter.post('/api/google-auth', async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || "secret";
  const JWT_EXPIRES_IN = "1d";

  try {
    const { credential } = req.body;
    if (!credential) {
      const err = new Error("Google credential token is required");
      err.statusCode = 400;
      throw err;
    }

    // Verify the token validity with Google's API authorization servers
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // 1. Look for an existing account matching this unique Google ID
    let user = await User.findOne({ googleId });

    // 2. Fallback: Check if they previously signed up with this email via password
    if (!user) {
      user = await User.findOne({ email_id: email.toLowerCase() });
      if (user) {
        // Link their Google account profile to this existing email record
        user.googleId = googleId;
        await user.save();
      }
    }

    // 3. Auto-Register: Create a new account if they don't exist yet (Sign-Up)
    if (!user) {
      // Clean name to make a unique user_name structure matching validations
      const safeUsername = name.replace(/\s+/g, '').slice(0, 12) + Math.floor(100 + Math.random() * 900);
      
      user = new User({
        user_name: safeUsername,
        email_id: email.toLowerCase(),
        googleId: googleId,
        // Password field is skipped since they authenticate through Google oauth provider
      });
      await user.save();
    }

    // Generate your own app's internal authorization JWT access token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: 'Google authentication completed successfully',
      data: {
        token,
        user: {
          _id: user._id,
          user_name: user.user_name,
          email_id: user.email_id
        }
      }
    });

  } catch (err) {
    next(err);
  }
});
userRouter.post('/api/signup',checkSchema(addUservalidnSchema),async (req,res,next)=>
{
 const JWT_SECRET = process.env.JWT_SECRET;
 const JWT_EXPIRES_IN ="1d"; 
  
  try{
    const body=req.body;
    const result=validationResult(req);
    if(!result.isEmpty())
    {
      const error = new Error(JSON.stringify(result.array()));
      error.statusCode=400;
      throw error;
    }
    const existingUser=await User.findOne({email_id:body.email_id});
    if(existingUser)
    {
      const error=new Error("User already Exists");
      error.statusCode=409;
      throw error;
    }
    body.password= await hashPassword(body.password);
    const newUser=new User(body);
    const savedUser= await newUser.save();
    const token=jwt.sign({userId:newUser._id},JWT_SECRET,{expiresIn:JWT_EXPIRES_IN});
    res.status(201).json(
      {
        success:true,
        message:'User created successfully',
        data:
        {
          token,
          user:newUser
        }
      }
    );
  }
  catch(err)
  {
    next(err);
  }
});
userRouter.post('/api/signin',async (req,res,next)=>
{
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN ="1d";
  try{
    const {email_id,password}=req.body;
    const user=await User.findOne({email_id});
    if(!user)
    {
      const err=new Error("User not found");
      err.statusCode=404;
      throw err;
    }
    const ispasswordAVL= await comparePassword(password,user.password);
    if(!ispasswordAVL)
    {
      const err=new Error("Password Incorrect");
      err.statusCode=400;
      throw err;
    }
    const token=jwt.sign({userId:user._id},JWT_SECRET,{expiresIn:JWT_EXPIRES_IN});
    res.status(201).json(
      {
        success:true,
        message:'User Logged IN successfully',
        data:
        {
          token,
          user:user
        }
      }
    );
  }
  catch(err)
  {
    next(err);
  }
});
// ✏️ Update Profile Username
userRouter.put('/api/user/update', reqAuth, async (req, res, next) => {
  try {
    const { user_name } = req.body;

    // Validate length rules exactly matching your schema requirements
    if (!user_name || user_name.trim().length < 6 || user_name.trim().length > 12) {
      const err = new Error("Username must be between 6 and 12 characters.");
      err.statusCode = 400;
      throw err;
    }

    // Check if the desired username is already claimed by someone else
    const existingUser = await User.findOne({ user_name: user_name.trim() });
    if (existingUser && existingUser._id.toString() !== req.userId.toString()) {
      const err = new Error("Username is already taken.");
      err.statusCode = 409;
      throw err;
    }

    // Update the record
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { user_name: user_name.trim() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Username updated successfully",
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
});
userRouter.get('/api/signout',async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User signed out successfully. Please clear your local tokens.'
    });
  } catch (error) {
    next(error);
  }
});
export default userRouter; 