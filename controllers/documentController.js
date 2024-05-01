const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fileUploadPath = path.join("uploads/files");
const imageUploadPath = path.join("uploads/images");
const adminModel = require("../models/adminModel");
const NotificationModel = require("../models/notificationModel");

let createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files.files[0] || "";
    const userId = req.userId;

    if (!content || !title || !files) {
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

    // Tạo một hàm để tạo tên file mới (uuid + timestamp)
    const generateUniqueFileName = (originalName) => {
      const extname = path.extname(originalName);
      const timestamp = Date.now();
      const uniqueFilename = `${uuidv4()}_${timestamp}${extname}`;
      return uniqueFilename;
    };

    const fileName = generateUniqueFileName(files.originalname);
    const filePath = path.join(fileUploadPath, fileName);
    fs.writeFileSync(filePath, files.buffer);
    const fileData = { name: files.originalname, path: fileName };

    let newDocument;
    let message;

    if (user.isAdmin) {
      newDocument = await postModel.create({
        user: userId,
        title,
        content,
        files: fileData,
        isDisplay: true,
        isDoc: true,
      });
      message = "Đăng tài liệu thành công";

      // Gửi thông báo cho những người theo dõi người tạo bài viết
      const followers = user.followers;
      const messageNoti = `đăng tài liệu mới.`;

      if (followers.length > 0) {
        followers.map(async (followerId) => {
          // Tạo thông báo
          const notification = new NotificationModel({
            sender: user._id,
            receiver: followerId,
            message: messageNoti,
            link: `/tai-lieu/${newDocument._id}`,
          });

          // Lưu thông báo vào cơ sở dữ liệu
          await notification.save();
        });
      }
    } else {
      newDocument = await postModel.create({
        user: userId,
        title,
        content,
        files: fileData,
        isDoc: true,
      });

      message = "Tạo tài liệu thành công. Chờ duyệt!";
    }

    document = await postModel
      .findById(newDocument._id)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes");

    res.status(200).json({
      code: 0,
      message: message,
      document,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: createPost",
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { title, content, documentId, fileOld } = req.body;
    const files = req.files.files || null;
    const userId = req.userId;

    const documentOld = await postModel.findById(documentId);

    if (!documentOld) {
      return res.status(404).json({
        code: 1,
        message: "Lỗi: Tài liệu không tồn tại",
      });
    }

    if (documentOld.isDelete || !documentOld.isDoc) {
      return res.status(404).json({
        code: 1,
        message: "Lỗi: Tài liệu không tồn tại",
      });
    }

    // Kiểm tra xem nội dung và tiêu đề có được cung cấp không
    if (!content || !title || (!files && !fileOld)) {
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
    let updateData;
    if (fileOld) {
      updateData = {
        user: userId,
        title,
        content,
        isDisplay: false,
      };
    } else {
      // Tạo đường dẫn và lưu trữ các tệp và hình ảnh
      const fileName = generateUniqueFileName(files[0].originalname);
      const filePath = path.join(fileUploadPath, fileName);
      fs.writeFileSync(filePath, files[0].buffer);
      const fileData = { name: files[0].originalname, path: fileName };

      updateData = {
        user: userId,
        title,
        content,
        isDisplay: false,
        files: fileData,
      };
    }

    if (user.isAdmin) {
      updateData.isDisplay = true;
    }

    await postModel.updateOne({ _id: documentId }, updateData);

    // Lấy tài liệu đã cập nhật và trả về
    const updatedDocument = await postModel
      .findById(documentId)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes");

    const message = user.isAdmin
      ? "Sửa tài liệu thành công"
      : "Sửa tài liệu thành công. Chờ duyệt!";

    res.status(200).json({
      code: 0,
      message: message,
      document: updatedDocument,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: error.code || 1,
      message: error.message || "Lỗi: updatePost",
    });
  }
};

let getDocuments = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;

    const count = await postModel.countDocuments({
      isDisplay: true,
      isDelete: false,
      isDoc: true,
    });

    const offset = 10 * (currentPage - 1);

    const documents = await postModel
      .find({ isDisplay: true, isDelete: false, isDoc: true })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy tài liệu thành công",
      count: count,
      documents: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getDocuments",
    });
  }
};

let getUnapprovedDocuments = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const userId = req.userId;
    let user = await userModel.findById(userId);
    let documents, count;

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
        isDoc: true,
      });

      const offset = 10 * (currentPage - 1);

      documents = await postModel
        .find({ isDisplay: false, isDelete: false, isDoc: true })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    } else {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: true,
        user: userId,
      });

      const offset = 10 * (currentPage - 1);

      documents = await postModel
        .find({ isDisplay: false, isDelete: false, user: userId, isDoc: true })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    }

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy tài liệu thành công",
      count: count,
      documents: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUnapprovedDocuments",
    });
  }
};

let getHistoryDocuments = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const userId = req.userId;
    let user = await userModel.findById(userId);
    let documents, count;

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
      isDoc: true,
    });

    const offset = 10 * (currentPage - 1);

    documents = await postModel
      .find({ isDisplay: true, isDelete: false, user: userId, isDoc: true })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy các tài liệu đã đăng thành công",
      count: count,
      documents: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getHistoryDocuments",
    });
  }
};

let getDocumentDetailById = async (req, res) => {
  try {
    const documentId = req.params.documentId;

    const documentDetail = await postModel
      .find({ _id: documentId, isDelete: false, isDoc: true, isDisplay: true })
      .select("-comments")
      .populate("user", "name pic");

    if (!documentDetail[0]) {
      throw {
        code: 1,
        message: "Không tìm thấy tài liệu",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin tài liệu thành công",
      documentDetail: documentDetail[0],
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getDocumentDetailById",
    });
  }
};

let getDocumentUnApprovedDetailById = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const userId = req.userId;

    const document = await postModel
      .find({ _id: documentId, isDelete: false, isDoc: true, isDisplay: false })
      .select("-comments")
      .populate("user", "name pic");

    if (!document[0]) {
      throw {
        code: 1,
        message: "Không tìm thấy tài liệu",
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

    if (!user.isAdmin && document[0].user._id !== userId) {
      throw {
        code: 1,
        message: "Không tìm thấy tài liệu",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin tài liệu thành công",
      document: document[0],
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPostDetailById",
    });
  }
};

let toggleLikeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;

    if (!documentId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy documentId",
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

    let post = await postModel.findById(documentId);
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
        message: "Hủy thích tài liệu thành công",
        like: post.likes,
      });

      await post.save();
      return;
    } else {
      // Nếu user chưa có trong likes, thêm mới vào
      post.likes.unshift({ user: userId });

      res.status(200).json({
        code: 0,
        message: "Thích tài liệu thành công",
        like: post.likes,
      });

      await post.save();
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

let approvedDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;

    if (!documentId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy documentId",
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

    if (!user.isAdmin) {
      throw {
        code: 1,
        message: "Lỗi: user không có quyền",
      };
    }

    const document = await postModel
      .findById(documentId)
      .populate("user", "name pic followers");
    if (!document || !document.isDoc || document.isDelete) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy tài liệu",
      };
    }

    if (document.isDisplay) {
      throw {
        code: 1,
        message: "Tài liệu đã được duyệt trước đó",
      };
    }

    await postModel.findByIdAndUpdate(
      documentId,
      { isDisplay: true },
      { new: true }
    );

    // Gửi thông báo cho người đăng bài
    const notificationToAuthor = new NotificationModel({
      sender: user._id, // Không cần thông tin người gửi, có thể để null
      receiver: document.user._id,
      message: "đã duyệt tài liệu của bạn",
      link: `/tai-lieu/${documentId}`,
    });
    await notificationToAuthor.save();

    // Gửi thông báo cho những người theo dõi người tạo tài liệu
    const followers = document.user.followers; // Danh sách người theo dõi người dùng
    const message = `đăng tài liệu mới.`;

    if (followers.length > 0) {
      followers.map(async (followerId) => {
        // Tạo thông báo
        const notification = new NotificationModel({
          sender: document.user._id,
          receiver: followerId,
          message: message,
          link: `/tai-lieu/${documentId}`,
        });

        // Lưu thông báo vào cơ sở dữ liệu
        await notification.save();
      });
    }

    res.status(200).json({
      code: 0,
      message: "Duyệt tài liệu thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: approvedDocument",
    });
  }
};

let deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;

    if (!documentId) {
      throw {
        code: 1,
        message: "Lỗi: không tìm thấy documentId",
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

    const document = await postModel.findById(documentId);

    if (!document || !document.isDoc) {
      throw {
        code: 1,
        message: "Lỗi: Không tìm thấy tài liệu",
      };
    }

    if (document.isDelete) {
      throw {
        code: 1,
        message: "Tài liệu đã được xóa trước đó",
      };
    }

    if (!user.isAdmin && !(user._id === document.user)) {
      throw {
        code: 1,
        message: "Lỗi: user không có quyền",
      };
    }

    await postModel.findByIdAndUpdate(
      documentId,
      { isDelete: true },
      { new: true }
    );

    res.status(200).json({
      code: 0,
      message: "Xóa tài liệu thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: deleteDocument",
    });
  }
};

let searchDocument = async (req, res) => {
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
      isDoc: true,
      title: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 10 * (currentPage - 1);

    const documents = await postModel
      .find({
        isDisplay: true,
        isDelete: false,
        isDoc: true,
        title: regex,
      })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm tài liệu thành công",
      count: count,
      documents: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchDocument",
    });
  }
};

let searchHistoryDocument = async (req, res) => {
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
      user: userId,
      isDisplay: true,
      isDelete: false,
      isDoc: true,
      title: regex,
    });

    const offset = 10 * (currentPage - 1);

    const documents = await postModel
      .find({
        user: userId,
        isDisplay: true,
        isDelete: false,
        isDoc: true,
        title: regex,
      })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm tài liệu thành công",
      count: count,
      documents: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchHistoryDocument",
    });
  }
};

let searchUnApprovedDocument = async (req, res) => {
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

    let documents, count;

    if (user.isAdmin) {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: true,
        title: regex,
      });

      const offset = 10 * (currentPage - 1);

      documents = await postModel

        .find({ isDisplay: false, isDelete: false, isDoc: true, title: regex })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    } else {
      count = await postModel.countDocuments({
        isDisplay: false,
        isDelete: false,
        isDoc: true,
        user: userId,
        title: regex,
      });

      const offset = 10 * (currentPage - 1);

      documents = await postModel
        .find({
          isDisplay: false,
          isDelete: false,
          user: userId,
          isDoc: true,
          title: regex,
        })
        .limit(10)
        .skip(offset)
        .populate("user", "name pic")
        .select("_id title createdAt updatedAt likes")
        .sort({ createdAt: -1 });
    }

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm tài liệu thành công",
      count: count,
      documents: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchUnApprovedDocument",
    });
  }
};

let searchDocumentSaved = async (req, res) => {
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
      isDoc: true,
    });

    const offset = 10 * (currentPage - 1);

    // Truy vấn các bài viết mà người dùng đã lưu
    const posts = await postModel
      .find({
        _id: { $in: user.postsSaved }, // Chỉ lấy các bài viết có ID nằm trong danh sách postsSaved của user
        title: regex, // Tìm kiếm theo tiêu đề bài viết
        isDisplay: true,
        isDelete: false,
        isDoc: true,
      })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      throw {
        code: 1,
        message: "Không có dữ liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchDocumentSaved",
    });
  }
};

//////////////////////// Admin //////////////////////

let getDeleteDocuments = async (req, res) => {
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
    let documents, count;

    count = await postModel.countDocuments({
      isDelete: true,
      isDoc: true,
    });

    const offset = 10 * (currentPage - 1);

    documents = await postModel
      .find({ isDelete: true, isDoc: true })
      .limit(10)
      .skip(offset)
      .populate("user", "name pic")
      .select("_id title createdAt updatedAt likes")
      .sort({ createdAt: -1 });

    if (!documents || documents.length === 0) {
      throw {
        code: 1,
        message: "Không có tài liệu đã xóa nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy tài liệu đã xóa thành công",
      count: count,
      data: documents,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getDeleteDocuments",
    });
  }
};

let getDocumentStatistics = async (req, res) => {
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
      isDoc: true,
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
      message: error.message || "Lỗi: getDocumentStatistics",
    });
  }
};

let getUnapprovedDocumentStatistics = async (req, res) => {
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
      isDoc: true,
      isDisplay: false,
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
      message: error.message || "Lỗi: getUnapprovedDocumentStatistics",
    });
  }
};

let getApprovedDocumentStatistics = async (req, res) => {
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
      isDoc: true,
      isDisplay: true,
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
      message: error.message || "Lỗi: getApprovedDocumentStatistics",
    });
  }
};

let getDocumentDeleteDetailById = async (req, res) => {
  try {
    const documentId = req.params.documentId;

    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    const documentDetail = await postModel
      .findById(documentId)
      .select("-comments")
      .populate("user", "name pic");

    if (!documentDetail || !documentDetail.isDoc) {
      throw {
        code: 1,
        message: "Không tìm thấy tài liệu",
      };
    }

    if (!documentDetail.isDelete) {
      throw {
        code: 1,
        message: "Tài liệu chưa được xóa",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin tài liệu thành công",
      data: documentDetail,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getDocumentDeleteDetailById",
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentDetailById,
  getDocumentUnApprovedDetailById,
  toggleLikeDocument,
  getUnapprovedDocuments,
  approvedDocument,
  deleteDocument,
  updateDocument,
  getHistoryDocuments,
  searchDocument,
  searchHistoryDocument,
  searchUnApprovedDocument,
  searchDocumentSaved,
  //////////////////admin/////////
  getDeleteDocuments,
  getDocumentStatistics,
  getUnapprovedDocumentStatistics,
  getApprovedDocumentStatistics,
  getDocumentDeleteDetailById,
};
