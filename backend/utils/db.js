const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const mongoUriDirect = process.env.MONGO_URI_DIRECT;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected (SRV)");
    return;
  } catch (error) {
    const isSrvDnsError =
      typeof error?.message === "string" &&
      error.message.includes("querySrv ECONNREFUSED");

    if (!isSrvDnsError || !mongoUriDirect) {
      throw error;
    }

    console.warn("SRV lookup failed. Retrying with MONGO_URI_DIRECT...");
    await mongoose.connect(mongoUriDirect);
    console.log("MongoDB connected (DIRECT)");
  }
};

module.exports = connectDB;
