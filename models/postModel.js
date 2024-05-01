const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: "users",
    },
    tags: [String],
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    images: [
      {
        _id: {
          type: String,
          default: uuidv4,
        },
        name: String, // Tên của hình ảnh
        path: String, // Đường dẫn của hình ảnh
      },
    ],
    files: [
      {
        _id: {
          type: String,
          default: uuidv4,
        },
        name: String, // Tên của tệp
        path: String, // Đường dẫn của tệp
      },
    ],
    likes: [
      {
        user: { type: String },
      },
    ],
    comments: [
      {
        type: String,
        ref: "comments",
      },
    ],
    isDoc: {
      type: Boolean,
      default: false,
    },
    isDisplay: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const postModel = mongoose.model("posts", postSchema);

module.exports = postModel;
