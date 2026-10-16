import mongoose from "mongoose";

let cached = global.mongoose || (global.mongoose = { conn: null });

export async function connectDB() {
  if (!cached.conn) cached.conn = await mongoose.connect(process.env.MONGODB_URI);
  return cached.conn;
}