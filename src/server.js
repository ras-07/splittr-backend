import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./config/db.js"; 
import userRouter from "./routes/UserRoutes/auth.js";
import grpRouter from "./routes/UserRoutes/creategrp.js";
import expRouter from "./routes/UserRoutes/addExpense.js";
import cors from "cors";

connectDB();
const app=express();
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL||"http://localhost:5173", // Standard Vite-React local port
  credentials: true
}));

const PORT=process.env.PORT||3000;
app.use(userRouter);
app.use(grpRouter);
app.use(expRouter);
// Add this at the bottom of your src/server.js
app.use((err, req, res, next) => {
  console.error("--- GLOBAL ERROR LOG ---");
  console.error(err.stack); // Prints the exact line where it broke in your terminal

  // Check if we defined a custom status code (like 400 or 409), otherwise default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message
  });
});

app.listen(PORT,()=>
{
  console.log(`Server started listening successfully${PORT}`);
})

