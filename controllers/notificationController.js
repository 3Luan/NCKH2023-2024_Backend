const postModel = require("../models/postModel");
const User = require("../models/userModel");
const path = require("path");
const NotificationModel = require("../models/notificationModel");

// let getNotifications = async (req, res) => {
//   try {
//     const currentPage = req.params.currentPage || 1;
//     const userId = req.userId;

//     let user = await User.findById(userId);

//     if (!user) {
//       throw {
//         code: 1,
//         message: "Lỗi: Không tìm thấy user",
//       };
//     }

//     const count = await NotificationModel.countDocuments({
//       receiver: userId,
//     });

//     const offset = 10 * (currentPage - 1);

//     // Lấy danh sách các ID của các bài viết mà người dùng đã lưu
//     const notifications = await NotificationModel.find({ receiver: userId })
//       .limit(10)
//       .skip(offset)
//       .populate("receiver", "name pic")
//       .populate("sender", "name pic")
//       .sort({ createdAt: -1 });

//     if (!notifications || notifications.length === 0) {
//       throw {
//         code: 1,
//         message: "Không có thông báo nào",
//       };
//     }

//     res.status(200).json({
//       code: 0,
//       message: "Lấy thông báo thành công",
//       count: count,
//       notifications: notifications,
//     });
//   } catch (error) {
//     res.status(200).json({
//       code: error.code || 1,
//       message: error.message || "Lỗi: getNotifications",
//     });
//   }
// };

let getNotifications = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const userId = req.userId;

    let user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy user",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa",
      };
    }

    const count = await NotificationModel.countDocuments({
      receiver: userId,
    });

    const limit = 10; // Số lượng thông báo tối đa trả về trong mỗi lần yêu cầu
    const skip = limit * (currentPage - 1);

    // Lấy danh sách thông báo với giới hạn và bỏ qua phù hợp
    const notifications = await NotificationModel.find({ receiver: userId })
      .limit(limit)
      .skip(skip)
      .populate("receiver", "name pic")
      .populate("sender", "name pic")
      .sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
      throw {
        code: 2,
        message: "Không có thông báo nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông báo thành công",
      count: count,
      notifications: notifications,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getNotifications",
    });
  }
};

let readNotification = async (req, res) => {
  try {
    const notificationId = req.body.notificationId;
    const userId = req.userId;

    let user = await User.findById(userId);

    let notification = await NotificationModel.findById(notificationId);

    if (!user) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy user",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa",
      };
    }

    if (!notification) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy thông báo",
      };
    }

    if (notification.isRead) {
      res.status(200).json({
        code: 0,
        message: "Thông báo đã được đọc trước đó",
      });
    }

    const updateData = {
      isRead: true,
    };

    await NotificationModel.updateOne({ _id: notificationId }, updateData);

    res.status(200).json({
      code: 0,
      message: "Đọc báo thành công",
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: readNotification",
    });
  }
};

let readAllNotification = async (req, res) => {
  try {
    const userId = req.userId;

    let user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy user",
      };
    }

    // Đánh dấu tất cả các thông báo chưa đọc thành đã đọc
    await NotificationModel.updateMany(
      { receiver: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      code: 0,
      message: "Đọc tất cả thông báo thành công",
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: readAllNotification",
    });
  }
};

let getUnreadNotification = async (req, res) => {
  try {
    const userId = req.userId;

    let user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy user",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Lỗi: Tài khoản đã bị khóa",
      };
    }

    const count = await NotificationModel.countDocuments({
      receiver: userId,
      isRead: false,
    });

    res.status(200).json({
      code: 0,
      message: "Lấy thông báo chưa đọc thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUnreadNotification",
    });
  }
};

module.exports = {
  getNotifications,
  readNotification,
  readAllNotification,
  getUnreadNotification,
};
