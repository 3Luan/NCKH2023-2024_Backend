const mongoose = require("mongoose");

// Định nghĩa schema cho VerificationCode
const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // Tự động xóa sau 15 phút (900 giây)
  },
});

// Tạo model từ schema
const VerificationCodeModel = mongoose.model(
  "VerificationCode",
  verificationCodeSchema
);

module.exports = VerificationCodeModel;
