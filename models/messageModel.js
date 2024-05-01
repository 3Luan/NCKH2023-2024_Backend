const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const messageSchema = mongoose.Schema(
  {
    sender: { type: String, ref: "users" },
    content: { type: String, trim: true },
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
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: String, ref: "users" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
