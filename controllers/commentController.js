const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const commentModel = require("../models/commentModel");
const NotificationModel = require("../models/notificationModel");
const adminModel = require("../models/adminModel");

let createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    const userId = req.userId;

    if (!content || !postId) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin chưa đủ",
      };
    }

    let user = await userModel.findById(userId);
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

    let post = await postModel
      .findById(postId)
      .populate("user", "name pic followers");

    if (!post) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy bài viết",
      };
    }

    // Tạo comment mới
    const comment = await commentModel.create({
      user: userId,
      content: content,
    });

    // Thêm comment vào mảng comments của post
    post.comments.unshift(comment._id);
    await post.save();

    // Lấy thông tin của comment vừa được tạo
    const commentInfo = await commentModel
      .findById(comment._id)
      .populate("user", "name pic");

    // Gửi thông báo cho người chủ bài viết
    if (userId !== post.user._id) {
      const notification = await NotificationModel.create({
        sender: userId, // Người gửi là người đã comment
        receiver: post.user._id, // Người nhận là chủ bài viết
        message: `đã bình luận bài viết của bạn`,
        link: `/community/post/${postId}`, // Đường dẫn đến bài viết
      });

      await notification.save();
    }

    res.status(200).json({
      code: 0,
      message: "Bình luận bài viết thành công",
      comment: commentInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi khi tạo bình luận",
    });
  }
};

let createReply = async (req, res) => {
  try {
    const { content, commentId, postId } = req.body;
    const userId = req.userId;

    if (!content || !commentId) {
      throw {
        code: 1,
        message: "Lỗi khi tạo phản hồi: Thông tin chưa đủ",
      };
    }

    let user = await userModel.findById(userId);
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

    let comment = await commentModel
      .findById(commentId)
      .populate("user", "name pic followers");

    if (!comment) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy bình luận",
      };
    }

    // Tạo reply mới
    const reply = await commentModel.create({
      user: userId,
      content: content,
    });

    // Thêm Reply vào mảng replies của comment
    comment.replies.unshift(reply._id);
    await comment.save();

    // Lấy thông tin của reply vừa được tạo
    const replyInfo = await commentModel
      .findById(reply._id)
      .populate("user", "name pic");

    // Gửi thông báo cho người chủ bài viết
    if (userId !== comment.user._id) {
      const notification = await NotificationModel.create({
        sender: userId, // Người gửi là người đã comment
        receiver: comment.user._id, // Người nhận là chủ bài viết
        message: `đã phản hồi bình luận của bạn`,
        link: `/community/post/${postId}`, // Đường dẫn đến bài viết
      });

      await notification.save();
    }

    res.status(200).json({
      code: 0,
      message: "Phản hồi thành công",
      commentId: comment._id,
      reply: replyInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi khi tạo phản hồi",
    });
  }
};

let getReplyByCommentId = async (req, res) => {
  try {
    const commentId = req.params.commentId;

    if (!commentId) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin chưa đủ",
      };
    }

    const comment = await commentModel
      .findById(commentId)

      .populate({
        path: "replies",
        match: { isDelete: false },
        populate: {
          path: "user",
          select: "name pic",
        },
      });

    if (!comment) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy bình luận",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy phản hồi theo bình luận thành công",
      comment,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getReplyByCommentId",
    });
  }
};

let getCommentByPostId = async (req, res) => {
  try {
    const postId = req.params.postId;

    if (!postId) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin chưa đủ",
      };
    }

    const post = await postModel
      .findById(postId)
      .select("_id comments")
      .populate({
        path: "comments",
        match: { isDelete: false }, // Chỉ lấy những comment có isDelete = false
        populate: {
          path: "user",
          select: "name pic",
        },
      });

    if (!post) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy bài viết",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy bình luận thành công",
      comment: post.comments,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getCommentByPostId",
    });
  }
};

let deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const userId = req.userId;

    if (!commentId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy commentId",
      };
    }

    let user = await userModel.findById(userId);

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

    const comment = await commentModel.findById(commentId);

    if (!comment) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy Bình luận",
      };
    }

    if (comment.isDelete) {
      throw {
        code: 1,
        message: "Bình luận đã được xóa trước đó",
      };
    }

    if (!user.isAdmin && !(user._id === comment.user)) {
      throw {
        code: 1,
        message: "Lỗi: user không có quyền",
      };
    }

    await commentModel.findByIdAndUpdate(
      commentId,
      { isDelete: true },
      { new: true }
    );

    res.status(200).json({
      code: 0,
      message: "Xóa bình luận thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: deleteComment",
    });
  }
};

let getDeleteComments = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const adminId = req.adminId;

    let admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy admin",
      };
    }
    let comments, count;

    count = await commentModel.countDocuments({
      isDelete: true,
    });

    const offset = 10 * (currentPage - 1);

    comments = await commentModel
      .find({ isDelete: true })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .sort({ createdAt: -1 });

    if (!comments || comments.length === 0) {
      throw {
        code: 1,
        message: "Không có bình luận, phản hồi đã xóa nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy bình luận, phản hồi đã xóa thành công",
      count: count,
      data: comments,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getDeleteComments",
    });
  }
};

module.exports = {
  createComment,
  createReply,
  getReplyByCommentId,
  deleteComment,
  getCommentByPostId,

  ///////////admin////////////
  getDeleteComments,
};
