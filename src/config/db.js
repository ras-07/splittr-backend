import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: false
    });
    console.log(`DB connection successful${process.env.MONGO_URI}`);
  } catch (err) {
    console.error(`Error connecting to the DB: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
