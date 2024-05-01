const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database cannot be connected:", error);
    process.exit(1); // Thoát quá trình nếu kết nối thất bại
  }
};

module.exports = connectDB;
