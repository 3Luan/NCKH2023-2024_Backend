const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4, // Sử dụng uuid để tạo giá trị _id
    },
    name: { type: "String", required: true },
    email: { type: "String", unique: true, required: true },
    password: { type: "String", default: null },
    name: { type: "String", required: true },
    gender: {
      type: String, // Có thể sử dụng String hoặc Enum tùy vào yêu cầu của bạn
      default: "male",
      enum: ["male", "female", "other"], // Nếu bạn muốn giới hạn các giá trị có thể cho giới tính
    },
    birth: {
      type: Date,
      default: "2003-11-29T00:00:00.000+00:00",
    },
    pic: {
      type: "String",
      default: "avatar_default.png",
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    isBan: {
      type: Boolean,
      required: true,
      default: false,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    followings: [{ type: String, ref: "users" }],
    followers: [{ type: String, ref: "users" }],
    postsSaved: [{ type: String, ref: "posts" }],
  },
  { timestamps: true }
);

const User = mongoose.model("users", userSchema);

module.exports = User;
