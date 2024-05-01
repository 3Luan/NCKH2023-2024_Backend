const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      // người gửi thông báo
      type: String,
      ref: "users",
      required: true,
    },

    receiver: {
      // người nhận thông báo
      type: String,
      ref: "users",
      required: true,
    },
    message: {
      // Nội dung thông báo
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      // Đường dẫn đến nội dung thông báo
      type: String,
    },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("Notification", notificationSchema);

module.exports = NotificationModel;
