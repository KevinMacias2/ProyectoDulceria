import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbConnection = async () => {
  try {
    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'ecommerce-db';

    await mongoose.connect(`${dbURI}/${dbName}`, {
      // If you use MongoDB < 8 you have to use this:
      //useNewUrlParser:true,
      //useUnifiedTopology:true
    });

    console.log(`MongoDB is connected to ${dbName}`);
  } catch (error) {
    console.log('⚠️  MongoDB connection failed:', error.message);
    console.log('⚠️  The application will continue but database operations will fail.');
    console.log('⚠️  Please install and start MongoDB to use the full functionality.');
  }
};

export default dbConnection;
