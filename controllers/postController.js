const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const NotificationModel = require("../models/notificationModel");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fileUploadPath = path.join("uploads/files");
const imageUploadPath = path.join("uploads/images");
const adminModel = require("../models/adminModel");

let createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const images = req.files.images || [];
    const files = req.files.files || [];
    const userId = req.userId;

    if (!content || !title) {
      throw {
        code: 1,
        message: "Lỗi khi tạo bài viết: Thông tin chưa đủ",
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

    // Tạo một hàm để tạo tên file mới (uuid + timestamp)
    const generateUniqueFileName = (originalName) => {
      const extname = path.extname(originalName);
      const timestamp = Date.now();
      const uniqueFilename = `${uuidv4()}_${timestamp}${extname}`;
      return uniqueFilename;
    };

    const filePaths = files.map((file) => {
      const fileName = generateUniqueFileName(file.originalname);
      const filePath = path.join(fileUploadPath, fileName);
      fs.writeFileSync(filePath, file.buffer);
      return { name: file.originalname, path: fileName };
    });

    const imagePaths = images.map((image) => {
      const fileName = generateUniqueFileName(image.originalname);
      const imagePath = path.join(imageUploadPath, fileName);
      fs.writeFileSync(imagePath, image.buffer);
      return { name: image.originalname, path: fileName };
    });

    let newPost;
    let message;

    if (user.isAdmin) {
      newPost = await postModel.create({
        user: userId,
        title,
        content,
        images: imagePaths,
        files: filePaths,
        isDisplay: true,
      });
      message = "Đăng bài viết thành công";

      // Gửi thông báo cho những người theo dõi người tạo bài viết
      const followers = user.followers;
      const messageNoti = `đăng bài viết mới.`;

      if (followers.length > 0) {
        followers.map(async (followerId) => {
          // Tạo thông báo
          const notification = new NotificationModel({
            sender: user._id,
            receiver: followerId,
            message: messageNoti,
            link: `/community/post/${newPost._id}`, // Đường dẫn đến bài viết
          });

          // Lưu thông báo vào cơ sở dữ liệu
          await notification.save();
        });
      }
    } else {
      newPost = await postModel.create({
        user: userId,
        title,
        content,
        images: imagePaths,
        files: filePaths,
      });

      message = "Tạo bài viết thành công. Chờ duyệt!";
    }

    post = await postModel
      .findById(newPost._id)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes");

    res.status(200).json({
      code: 0,
      message: message,
      post,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: createPost",
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { title, content, postId, imagesOld, filesOld } = req.body;
    const images = req.files.images || [];
    const files = req.files.files || [];
    const userId = req.userId;

    // Kiểm tra xem bài viết có tồn tại không
    const postOld = await postModel.findById(postId);
    if (!postOld) {
      return res.status(404).json({
        code: 1,
        message: "Lỗi: Bài viết không tồn tại",
      });
    }

    if (postOld.isDelete) {
      return res.status(404).json({
        code: 1,
        message: "Lỗi: Bài viết đã bị xóa trước đó",
      });
    }

    // Kiểm tra xem nội dung và tiêu đề có được cung cấp không
    if (!content || !title) {
      return res.status(400).json({
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      });
    }

    // Kiểm tra xem người dùng có tồn tại không
    const user = await userModel.findById(userId);
    if (!user) {
      throw {
        code: 1,
        message: "Lỗi: Người dùng không tồn tại",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa",
      };
    }

    // Tạo một hàm để tạo tên file mới (uuid + timestamp)
    const generateUniqueFileName = (originalName) => {
      const extname = path.extname(originalName);
      const timestamp = Date.now();
      const uniqueFilename = `${uuidv4()}_${timestamp}${extname}`;
      return uniqueFilename;
    };

    // Xác định các ID của các hình ảnh cũ từ đối tượng imagesOld
    if (imagesOld) {
      if (!Array.isArray(imagesOld)) {
        const imagesToRemove = postOld.images.filter(
          (image) => !imagesOld.includes(image._id)
        );

        imagesToRemove.forEach(async (image) => {
          await postModel.updateOne(
            { _id: postId },
            { $pull: { images: { _id: image._id } } }
          );
        });
      } else {
        const imagesToRemove = postOld.images.filter(
          (image) => !imagesOld.includes(image._id)
        );

        imagesToRemove.forEach(async (image) => {
          await postModel.updateOne(
            { _id: postId },
            { $pull: { images: { _id: image._id } } }
          );
        });
      }
    }

    if (filesOld) {
      if (!Array.isArray(filesOld)) {
        const filesToRemove = postOld.files.filter(
          (file) => !filesOld.includes(file._id)
        );

        filesToRemove.forEach(async (file) => {
          await postModel.updateOne(
            { _id: postId },
            { $pull: { files: { _id: file._id } } }
          );
        });
      } else {
        const filesToRemove = postOld.files.filter(
          (file) => !filesOld.includes(file._id)
        );

        filesToRemove.forEach(async (file) => {
          await postModel.updateOne(
            { _id: postId },
            { $pull: { files: { _id: file._id } } }
          );
        });
      }
    }

    // Tạo đường dẫn và lưu trữ các tệp và hình ảnh
    const filePaths = files.map((file) => {
      const fileName = generateUniqueFileName(file.originalname);
      const filePath = path.join(fileUploadPath, fileName);
      fs.writeFileSync(filePath, file.buffer);
      return { name: file.originalname, path: fileName };
    });

    const imagePaths = images.map((image) => {
      const fileName = generateUniqueFileName(image.originalname);
      const imagePath = path.join(imageUploadPath, fileName);
      fs.writeFileSync(imagePath, image.buffer);
      return { name: image.originalname, path: fileName };
    });

    // Cập nhật bài viết
    const updateData = {
      user: userId,
      title,
      content,
      isDisplay: false,
      $push: { images: { $each: imagePaths }, files: { $each: filePaths } },
    };

    if (user.isAdmin) {
      updateData.isDisplay = true;
    }

    await postModel.updateOne({ _id: postId }, updateData);

    // Lấy bài viết đã cập nhật và trả về
    const updatedPost = await postModel
      .findById(postId)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes");

    const message = user.isAdmin
      ? "Sửa bài viết thành công"
      : "Sửa bài viết thành công. Chờ duyệt!";

    res.status(200).json({
      code: 0,
      message: message,
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: error.code || 1,
      message: error.message || "Lỗi: updatePost",
    });
  }
};

let getPosts = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;

    const count = await postModel.countDocuments({
      isDisplay: true,
      isDelete: false,
      isDoc: false,
    });

    const offset = 10 * (currentPage - 1);

    const posts = await postModel
      .find({ isDisplay: true, isDelete: false, isDoc: false })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy bài viết thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPosts",
    });
  }
};

let getUnapprovedPosts = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const userId = req.userId;
    let user = await userModel.findById(userId);
    let posts, count;

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

    if (user.isAdmin) {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: false,
      });

      const offset = 10 * (currentPage - 1);

      posts = await postModel
        .find({ isDisplay: false, isDelete: false, isDoc: false })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    } else {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: false,
        user: userId,
      });

      const offset = 10 * (currentPage - 1);

      posts = await postModel
        .find({ isDisplay: false, isDelete: false, user: userId, isDoc: false })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    }

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào1",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy bài viết thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUnapprovedPosts",
    });
  }
};

let getHistoryPosts = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const userId = req.userId;
    let user = await userModel.findById(userId);
    let posts, count;

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

    count = await postModel.countDocuments({
      isDisplay: true,
      isDelete: false,
      user: userId,
      isDoc: false,
    });

    const offset = 10 * (currentPage - 1);

    posts = await postModel
      .find({ isDisplay: true, isDelete: false, user: userId, isDoc: false })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào1",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy các bài viết đã đăng thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getHistoryPosts",
    });
  }
};

let getPostDetailById = async (req, res) => {
  try {
    const postId = req.params.postId;

    const postDetail = await postModel
      .find({ _id: postId, isDelete: false, isDoc: false, isDisplay: true })
      .select("-comments")
      .populate("user", "name pic");

    if (!postDetail[0]) {
      throw {
        code: 1,
        message: "Không tìm thấy bài viết",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin bài viết thành công",
      postDetail: postDetail[0],
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPostDetailById",
    });
  }
};

let getPostUnApprovedDetailById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;

    const postDetail = await postModel
      .findById(postId)
      .select("-comments")
      .populate("user", "name pic");

    if (!postDetail) {
      throw {
        code: 1,
        message: "Không tìm thấy bài viết",
      };
    }

    if (postDetail.isDelete || postDetail.isDisplay || postDetail.isDoc) {
      throw {
        code: 1,
        message: "Không tìm thấy bài viết",
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

    if (!user.isAdmin && postDetail.user._id !== userId) {
      if (postDetail.isDelete || !postDetail.isDisplay || postDetail.isDoc) {
        throw {
          code: 1,
          message: "Không tìm thấy bài viết",
        };
      }
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin bài viết thành công",
      postDetail: postDetail,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPostDetailById",
    });
  }
};

let toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.userId;

    if (!postId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy postId",
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

    // Tìm user like trong post của người dùng
    const existingUserIndex = post.likes.findIndex(
      (item) => item.user === userId
    );

    if (existingUserIndex !== -1) {
      // Nếu user đã tồn tại - xóa user đó ra
      post.likes.splice(existingUserIndex, 1);

      res.status(200).json({
        code: 0,
        message: "Hủy thích bài viết thành công",
        like: post.likes,
      });

      await post.save();
      return;
    } else {
      // Nếu user chưa có trong likes, thêm mới vào
      post.likes.unshift({ user: userId });

      res.status(200).json({
        code: 0,
        message: "Thích bài viết thành công",
        like: post.likes,
      });

      await post.save();

      // Gửi thông báo cho người chủ bài viết
      if (userId !== post.user._id) {
        const notification = await NotificationModel.create({
          sender: userId, // Người gửi là người đã comment
          receiver: post.user._id, // Người nhận là chủ bài viết
          message: `đã thích bài viết của bạn`,
          link: `/community/post/${postId}`, // Đường dẫn đến bài viết
        });

        await notification.save();
      }

      return;
    }
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: toggleLikePost",
    });
  }
};

const approvedPost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.userId;

    if (!postId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy postId",
      };
    }

    const user = await userModel.findById(userId);

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

    if (!user.isAdmin) {
      throw {
        code: 1,
        message: "Lỗi: user không có quyền",
      };
    }

    const post = await postModel
      .findById(postId)
      .populate("user", "name pic followers");

    if (!post) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy bài viết",
      };
    }

    if (post.isDisplay) {
      throw {
        code: 1,
        message: "Bài viết đã được duyệt trước đó",
      };
    }

    // Cập nhật trạng thái bài viết
    await postModel.findByIdAndUpdate(
      postId,
      { isDisplay: true },
      { new: true }
    );

    // Gửi thông báo cho người đăng bài
    const notificationToAuthor = new NotificationModel({
      sender: user._id, // Không cần thông tin người gửi, có thể để null
      receiver: post.user._id,
      message: "đã duyệt bài viết của bạn",
      link: `/community/post/${postId}`, // Đường dẫn đến bài viết
    });
    await notificationToAuthor.save();

    // Gửi thông báo cho những người theo dõi người tạo bài viết
    const followers = post.user.followers; // Danh sách người theo dõi người dùng
    const message = `đăng bài viết mới.`;

    if (followers.length > 0) {
      followers.map(async (followerId) => {
        // Tạo thông báo
        const notification = new NotificationModel({
          sender: post.user._id,
          receiver: followerId,
          message: message,
          link: `/community/post/${postId}`, // Đường dẫn đến bài viết
        });

        // Lưu thông báo vào cơ sở dữ liệu
        await notification.save();
      });
    }

    res.status(200).json({
      code: 0,
      message: "Duyệt bài viết thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: approvedPost",
    });
  }
};

let deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.userId;

    if (!postId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy postId",
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

    const post = await postModel.findById(postId);

    if (!post) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy bài viết",
      };
    }

    if (post.isDelete) {
      throw {
        code: 1,
        message: "Bài viết đã được xóa trước đó",
      };
    }

    if (!user.isAdmin && !(user._id === post.user)) {
      throw {
        code: 1,
        message: "Lỗi: user không có quyền",
      };
    }

    await postModel.findByIdAndUpdate(
      postId,
      { isDelete: true },
      { new: true }
    );

    res.status(200).json({
      code: 0,
      message: "Xóa bài viết thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: deletePost",
    });
  }
};

let searchPost = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;

    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i"); // Tạo biểu thức chính quy từ keyword, 'i' để không phân biệt chữ hoa chữ thường

    const count = await postModel.countDocuments({
      isDisplay: true,
      isDelete: false,
      isDoc: false,
      title: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 10 * (currentPage - 1);

    const posts = await postModel
      .find({
        isDisplay: true,
        isDelete: false,
        isDoc: false,
        title: regex, // Tìm kiếm tiêu đề chứa từ khóa
      })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm bài viết thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchPost",
    });
  }
};

let searchHistoryPost = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const userId = req.userId;

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

    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i");

    const count = await postModel.countDocuments({
      isDisplay: true,
      isDelete: false,
      isDoc: false,
      user: userId,
      title: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 10 * (currentPage - 1);

    const posts = await postModel
      .find({
        isDisplay: true,
        isDelete: false,
        user: userId,
        isDoc: false,
        title: regex, // Tìm kiếm tiêu đề chứa từ khóa
      })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm bài viết thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchHistoryPost",
    });
  }
};

let searchUnapprovedPost = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const userId = req.userId;

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
    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i");
    let posts, count;

    if (user.isAdmin) {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: false,
        title: regex,
      });

      const offset = 10 * (currentPage - 1);

      posts = await postModel
        .find({ isDisplay: false, isDelete: false, isDoc: false, title: regex })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    } else {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: false,
        user: userId,
        title: regex,
      });

      const offset = 10 * (currentPage - 1);

      posts = await postModel
        .find({
          isDisplay: false,
          isDelete: false,
          user: userId,
          isDoc: false,
          title: regex,
        })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    }

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm bài viết thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchUnapprovedPost",
    });
  }
};

let searchPostSaved = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const userId = req.userId;
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

    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i"); // Tạo biểu thức chính quy từ keyword, 'i' để không phân biệt chữ hoa chữ thường

    const count = await postModel.countDocuments({
      _id: { $in: user.postsSaved }, // Chỉ lấy các bài viết có ID nằm trong danh sách postsSaved của user
      title: regex, // Tìm kiếm theo tiêu đề bài viết
      isDisplay: true,
      isDelete: false,
      isDoc: false,
    });

    const offset = 10 * (currentPage - 1);

    // Truy vấn các bài viết mà người dùng đã lưu
    const posts = await postModel
      .find({
        _id: { $in: user.postsSaved }, // Chỉ lấy các bài viết có ID nằm trong danh sách postsSaved của user
        title: regex, // Tìm kiếm theo tiêu đề bài viết
        isDisplay: true,
        isDelete: false,
        isDoc: false,
      })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm bài viết thành công",
      count: count,
      data: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchPostSaved",
    });
  }
};

//////////////////////// Admin //////////////////////

let getDeletePosts = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const adminId = req.adminId;

    let admin = await adminModel.findById(adminId);

    let posts, count;

    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy admin",
      };
    }

    count = await postModel.countDocuments({
      isDelete: true,
      isDoc: false,
    });

    const offset = 10 * (currentPage - 1);

    posts = await postModel
      .find({ isDelete: true, isDoc: false })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có bài viết nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy bài viết thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getDeletePosts",
    });
  }
};

let getPostsStatistics = async (req, res) => {
  try {
    const { day, month, year } = req.params;

    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    let query = {
      isDelete: false,
      isDoc: false,
    };

    if (day !== "null" && month && year) {
      const startDate = new Date(`${year}-${month}-${day}`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    } else if (month !== "null" && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const nextMonth = parseInt(month) + 1;
      const endDate = new Date(`${year}-${nextMonth}-01`);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01`);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    }

    const count = await postModel.countDocuments(query);

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPostsStatistics",
    });
  }
};

let getUnapprovedPostsStatistics = async (req, res) => {
  try {
    const { day, month, year } = req.params;

    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    let query = {
      isDisplay: false,
      isDelete: false,
      isDoc: false,
    };

    if (day !== "null" && month && year) {
      const startDate = new Date(`${year}-${month}-${day}`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    } else if (month !== "null" && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const nextMonth = parseInt(month) + 1;
      const endDate = new Date(`${year}-${nextMonth}-01`);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01`);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    }

    const count = await postModel.countDocuments(query);

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUnapprovedPostsStatistics",
    });
  }
};

let getapprovedPostsStatistics = async (req, res) => {
  try {
    const { day, month, year } = req.params;

    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    let query = {
      isDisplay: true,
      isDelete: false,
      isDoc: false,
    };

    if (day !== "null" && month && year) {
      const startDate = new Date(`${year}-${month}-${day}`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    } else if (month !== "null" && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const nextMonth = parseInt(month) + 1;
      const endDate = new Date(`${year}-${nextMonth}-01`);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01`);
      query.updatedAt = { $gte: startDate, $lt: endDate };
    }

    const count = await postModel.countDocuments(query);

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getapprovedPostsStatistics",
    });
  }
};

let getPostDeleteDetailById = async (req, res) => {
  try {
    const postId = req.params.postId;

    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    const postDetail = await postModel
      .findById(postId)
      .select("-comments")
      .populate("user", "name pic");

    if (!postDetail || postDetail.isDoc) {
      throw {
        code: 1,
        message: "Không tìm thấy bài viết",
      };
    }

    if (!postDetail.isDelete) {
      throw {
        code: 1,
        message: "Bài viết chưa được xóa",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin bài viết thành công",
      data: postDetail,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPostDeleteDetailById",
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostDetailById,
  getPostUnApprovedDetailById,
  toggleLikePost,
  getUnapprovedPosts,
  approvedPost,
  deletePost,
  updatePost,
  getHistoryPosts,
  searchPost,
  searchHistoryPost,
  searchUnapprovedPost,
  searchPostSaved,

  /////////////admin///////////////
  getDeletePosts,
  getPostsStatistics,
  getUnapprovedPostsStatistics,
  getapprovedPostsStatistics,
  getPostDeleteDetailById,
};
