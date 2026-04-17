import mongoose from "mongoose";

export const connectDB = async (): Promise<void> =>{
    const uri = process.env.MONGODB_URI
    if(!uri) throw new Error("MONGODB_URI is not defined");
    await mongoose.connect(uri);
    console.log("mongodb connected");
}

export const disconnectDB = async ():Promise<void> =>{
    await mongoose.disconnect();
}