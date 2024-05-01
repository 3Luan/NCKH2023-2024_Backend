const postModel = require("../models/postModel");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const imageUploadPath = path.join("uploads/images");
const adminModel = require("../models/adminModel");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
let allUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.userId } });

    res.status(200).json({
      code: 0,
      message: "Lấy tất cả User thành công",
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: allUsers",
    });
  }
};

// Theo dõi
let followUser = async (req, res) => {
  try {
    const userIdOne = req.userId; // Người đăng nhập
    const userIdTwo = req.body.userId; // Người còn lại

    const userTwoData = await User.findById(userIdTwo);

    if (!userTwoData) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (!userTwoData.followers.includes(userIdOne)) {
      await User.findOneAndUpdate(
        { _id: userIdTwo },
        { $push: { followers: userIdOne } }
      );
      await User.findOneAndUpdate(
        { _id: userIdOne },
        { $push: { followings: userIdTwo } }
      );
    } else {
      throw {
        code: 1,
        message: "Người dùng này đã tồn tại trong danh sách theo dõi",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Theo dõi thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: followUser",
    });
  }
};

// Hủy theo dõi
let unFollowUser = async (req, res) => {
  try {
    const userIdOne = req.userId; // Người đăng nhập
    const userIdTwo = req.body.userId; // Người còn lại

    const userTwoData = await User.findById(userIdTwo);

    if (!userTwoData) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (userTwoData.followers.includes(userIdOne)) {
      await User.findOneAndUpdate(
        { _id: userIdTwo },
        { $pull: { followers: userIdOne } }
      );
      await User.findOneAndUpdate(
        { _id: userIdOne },
        { $pull: { followings: userIdTwo } }
      );
    } else {
      throw {
        code: 1,
        message: "Người dùng này chưa tồn tại trong danh sách theo dõi",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Hủy theo dõi thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: unFollowUser",
    });
  }
};

// Lấy danh sách người dùng mà bạn chưa follow
let getUnFollowed = async (req, res) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    const currentPage = req.params.currentPage || 1;

    const count = await User.find({
      _id: { $nin: currentUser.followings, $ne: userId },
      isBan: false,
    }).countDocuments();

    const offset = 12 * (currentPage - 1);

    const unfollowedUsers = await User.find({
      _id: { $nin: currentUser.followings, $ne: userId },
      isBan: false,
    })
      .limit(12)
      .skip(offset);

    res.status(200).json({
      code: 0,
      message: "Lấy danh sách người dùng chưa follow thành công",
      count: count,
      data: unfollowedUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getUnFollowedUsers",
    });
  }
};

// Lấy danh sách người dùng mà bạn đã follow
let getFollowings = async (req, res) => {
  try {
    const userId = req.userId;
    const currentPage = req.params.currentPage || 1;
    const currentUser = await User.findById(userId);

    const count = await User.find({
      _id: { $in: currentUser.followings, $ne: userId },
      isBan: false,
    }).countDocuments();

    const offset = 12 * (currentPage - 1);

    const followingUsers = await User.find({
      _id: { $in: currentUser.followings, $ne: userId },
      isBan: false,
    })
      .limit(12)
      .skip(offset);

    res.status(200).json({
      code: 0,
      message: "Lấy danh sách followings thành công",
      count: count,
      data: followingUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getFollowings",
    });
  }
};

// Lấy danh sách người dùng mà đã follow bạn
let getFollowers = async (req, res) => {
  try {
    const userId = req.userId;
    const currentPage = req.params.currentPage || 1;
    const currentUser = await User.findById(userId);

    const count = await User.find({
      _id: { $in: currentUser.followers, $ne: userId },
      isBan: false,
    }).countDocuments();

    const offset = 12 * (currentPage - 1);

    const followerUsers = await User.find({
      _id: { $in: currentUser.followers, $ne: userId },
      isBan: false,
    })
      .limit(12)
      .skip(offset);

    res.status(200).json({
      code: 0,
      message: "Lấy danh sách followers thành công",
      count: count,
      data: followerUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getFollowers",
    });
  }
};

// Lấy thông tin người dùng thông qua ID
let getUserInfoById = async (req, res) => {
  try {
    const userId = req.params.userId;

    let user = await User.findById(userId).select(
      "_id name pic email isAdmin gender birth followings followers"
    );

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa",
      };
    }

    const countFollowings = await User.find({
      _id: { $in: user.followings, $ne: userId },
      isBan: false,
    }).countDocuments();

    const countFollowers = await User.find({
      _id: { $in: user.followers, $ne: userId },
      isBan: false,
    }).countDocuments();

    // user = { ...user, countFollowings, countFollowers };

    res.status(200).json({
      code: 0,
      message: "Lấy thông tin user thành công",
      data: { user, countFollowings, countFollowers },
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getUserInfoById",
    });
  }
};

// Lấy thông tin các bài viết người dùng đã lưu
let getSavePosts = async (req, res) => {
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
    // Lấy danh sách các ID của các bài viết mà người dùng đã lưu
    const postsSavedIds = user.postsSaved;

    // Đếm số lượng bài viết mà người dùng đã lưu
    const count = postsSavedIds.length;

    // Tính toán offset
    const offset = 10 * (currentPage - 1);

    // Truy vấn các bài viết mà người dùng đã lưu
    const posts = await postModel
      .find({
        _id: { $in: postsSavedIds }, // Chỉ lấy các bài viết có ID nằm trong danh sách postsSavedIds
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
      message: "Lấy bài viết đã lưu thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getPostsSaved",
    });
  }
};

let getSaveDocuments = async (req, res) => {
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
    // Lấy danh sách các ID của các bài viết mà người dùng đã lưu
    const postsSavedIds = user.postsSaved;

    // Đếm số lượng bài viết mà người dùng đã lưu
    const count = postsSavedIds.length;

    // Tính toán offset
    const offset = 10 * (currentPage - 1);

    // Truy vấn các bài viết mà người dùng đã lưu
    const posts = await postModel
      .find({
        _id: { $in: postsSavedIds }, // Chỉ lấy các bài viết có ID nằm trong danh sách postsSavedIds
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
        message: "Không có tài liệu nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy tài liệu đã lưu thành công",
      count: count,
      posts: posts,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getSaveDocuments",
    });
  }
};

// Lưu bài viết
let savedPost = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = req.body.postId;

    const user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
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
        message: "Bài viết không tồn tại",
      };
    }

    if (!user.postsSaved.includes(postId)) {
      await User.findOneAndUpdate(
        { _id: userId },
        { $push: { postsSaved: postId } }
      );
    } else {
      throw {
        code: 1,
        message: "Bài viết này đã tồn tại trong danh sách lưu",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lưu thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: savedPost",
    });
  }
};

// Hủy lưu bài viết
let unSavedPost = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = req.body.postId;

    const user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
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
        message: "Bài viết không tồn tại",
      };
    }

    if (user.postsSaved.includes(postId)) {
      await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { postsSaved: postId } }
      );
    } else {
      throw {
        code: 1,
        message: "Bài viết này không tồn tại trong danh sách lưu",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Hủy lưu thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: unSavedPost",
    });
  }
};

let updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, gender, birth, picOld } = req.body;
    const pic = req.files.pic || "";

    if (!name || !gender || !birth || (!pic && !picOld)) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      };
    }

    console.log(birth);

    const user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
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
    if (picOld) {
      updateData = {
        user: userId,
        name,
        gender,
        birth,
      };
    } else {
      // Tạo đường dẫn và lưu trữ các tệp và hình ảnh
      const fileName = generateUniqueFileName(pic[0].originalname);
      const filePath = path.join(imageUploadPath, fileName);
      fs.writeFileSync(filePath, pic[0].buffer);
      const fileData = { name: pic[0].originalname, path: fileName };

      updateData = {
        user: userId,
        name,
        gender,
        birth,
        pic: fileData.path,
      };
    }

    await User.updateOne({ _id: userId }, updateData);

    res.status(200).json({
      code: 0,
      message: "Lưu thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: updateProfile",
    });
  }
};

let searchUnFollowed = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
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

    const count = await User.countDocuments({
      _id: { $nin: user.followings, $ne: userId },
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 12 * (currentPage - 1);

    const users = await User.find({
      _id: { $nin: user.followings, $ne: userId },
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    })
      .limit(12)
      .skip(offset)
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      throw {
        code: 1,
        message: "Không có data nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchUnFollowed",
    });
  }
};

let searchFollowers = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
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

    const count = await User.countDocuments({
      _id: { $in: user.followers, $ne: userId },
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 12 * (currentPage - 1);

    const users = await User.find({
      _id: { $in: user.followers, $ne: userId },
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    })
      .limit(12)
      .skip(offset)
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      throw {
        code: 1,
        message: "Không có data nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchFollowers",
    });
  }
};

let searchFollowings = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
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

    const count = await User.countDocuments({
      _id: { $in: user.followings, $ne: userId },
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 12 * (currentPage - 1);

    const users = await User.find({
      _id: { $in: user.followings, $ne: userId },
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    })
      .limit(12)
      .skip(offset)
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      throw {
        code: 1,
        message: "Không có data nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchFollowings",
    });
  }
};

let getSavePostId = async (req, res) => {
  try {
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
    // Lấy danh sách các ID của các bài viết mà người dùng đã lưu
    const postsSavedIds = user.postsSaved;

    if (!postsSavedIds || postsSavedIds.length === 0) {
      throw {
        code: 1,
        message: "Không có data nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Lấy data thành công",
      data: postsSavedIds,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getSavePostId",
    });
  }
};

//////////////////////// Admin //////////////////////

// Lấy danh sách Người kiểm duyệt
let getAdmin = async (req, res) => {
  try {
    const adminId = req.adminId;
    const currentPage = req.params.currentPage || 1;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const count = await User.countDocuments({
      isAdmin: true,
      isBan: false,
    });

    const offset = 12 * (currentPage - 1);

    const data = await User.find({
      isAdmin: true,
      isBan: false,
    })
      .limit(12)
      .skip(offset);

    res.status(200).json({
      code: 0,
      message: "Lấy danh sách Người kiểm duyệt thành công",
      count: count,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getAdmin",
    });
  }
};

// Lấy tất cả user không phải là Người kiểm duyệt
let getAllUser = async (req, res) => {
  try {
    const adminId = req.adminId;
    const currentPage = req.params.currentPage || 1;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const count = await User.countDocuments({
      isAdmin: false,
      isBan: false,
    });

    const offset = 12 * (currentPage - 1);

    const data = await User.find({
      isAdmin: false,
      isBan: false,
    })
      .limit(12)
      .skip(offset);

    res.status(200).json({
      code: 0,
      message: "Lấy danh sách tất cả user thành công",
      count: count,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getAllUser",
    });
  }
};

// Cấp quyền admin cho user
let grantAdminRole = async (req, res) => {
  try {
    const adminId = req.adminId;
    const userId = req.body.userId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const user = await User.findById(userId);
    if (!user || user.isBan) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (user.isAdmin) {
      throw {
        code: 1,
        message: "Người dùng đã là Người kiểm duyệt",
      };
    }

    user.isAdmin = true;
    await user.save();

    res.status(200).json({
      code: 0,
      message: "Cấp quyền Người kiểm duyệt cho user thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: grantAdminRole",
    });
  }
};

let revokeAdminRole = async (req, res) => {
  try {
    const adminId = req.adminId;
    const userId = req.body.userId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const user = await User.findById(userId);
    if (!user || user.isBan) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (!user.isAdmin) {
      throw {
        code: 1,
        message: "Người dùng không phải là Người kiểm duyệt",
      };
    }

    user.isAdmin = false;
    await user.save();

    res.status(200).json({
      code: 0,
      message: "Xóa quyền Người kiểm duyệt cho user thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: revokeAdminRole",
    });
  }
};

let searchUserRole = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;
    const adminId = req.adminId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i");

    const count = await User.countDocuments({
      isAdmin: false,
      isBan: false,
      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 12 * (currentPage - 1);

    const users = await User.find({
      isAdmin: false,
      isBan: false,
      name: regex,
    })
      .limit(12)
      .skip(offset)
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      throw {
        code: 1,
        message: "Không có data nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchUserRole",
    });
  }
};

let searchAdminRole = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;

    const adminId = req.adminId;

    const admin = await adminModel.findById(adminId);

    console.log("keyword", keyword);
    console.log("currentPage", currentPage);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i");

    const count = await User.countDocuments({
      isAdmin: true,
      isBan: false,

      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 12 * (currentPage - 1);

    const users = await User.find({
      isAdmin: true,
      isBan: false,

      name: regex,
    })
      .limit(12)
      .skip(offset)
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      throw {
        code: 1,
        message: "Không có data nào",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: users,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchAdminRole",
    });
  }
};

let getUserStatistics = async (req, res) => {
  try {
    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    const count = await User.countDocuments();

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUserStatistics",
    });
  }
};

let getUserIsBanStatistics = async (req, res) => {
  try {
    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    let query = {
      isBan: true,
    };

    const count = await User.countDocuments(query);

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUserIsBanStatistics",
    });
  }
};

let getUserNotBanStatistics = async (req, res) => {
  try {
    const adminId = req.adminId;
    let admin = await adminModel.findById(adminId);
    if (!admin) {
      throw {
        code: 1,
        message: "Lỗi: không tin thấy admin",
      };
    }

    let query = {
      isBan: false,
    };

    const count = await User.countDocuments(query);

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getUserIsBanStatistics",
    });
  }
};

let banUser = async (req, res) => {
  try {
    const adminId = req.adminId;
    const userId = req.body.userId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa trước đó",
      };
    }

    user.isBan = true;
    await user.save();

    res.status(200).json({
      code: 0,
      message: "Khóa tài khoản thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: banUser",
    });
  }
};

let unBanUser = async (req, res) => {
  try {
    const adminId = req.adminId;
    const userId = req.body.userId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw {
        code: 1,
        message: "Người dùng không tồn tại",
      };
    }

    if (!user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này vẫn còn hoạt động",
      };
    }

    user.isBan = false;
    await user.save();

    res.status(200).json({
      code: 0,
      message: "Mở khóa tài khoản thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: unBanUser",
    });
  }
};

let getBanUser = async (req, res) => {
  try {
    const adminId = req.adminId;
    const currentPage = req.params.currentPage || 1;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    const count = await User.countDocuments({
      isBan: true,
    });

    const offset = 12 * (currentPage - 1);

    const data = await User.find({
      isBan: true,
    })
      .limit(12)
      .skip(offset);

    res.status(200).json({
      code: 0,
      message: "Lấy danh sách thành công",
      count: count,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: getBanUser",
    });
  }
};

let searchBanUser = async (req, res) => {
  try {
    const currentPage = req.params.currentPage || 1;
    const keyword = req.params.keyword || null;

    const adminId = req.adminId;

    const admin = await adminModel.findById(adminId);

    if (!admin) {
      throw {
        code: 1,
        message: "Admin không tồn tại",
      };
    }

    if (!keyword) {
      throw {
        code: 1,
        message: "Hãy nhập nội dung tìm kiếm",
      };
    }

    const regex = new RegExp(keyword, "i");

    const count = await User.countDocuments({
      isBan: true,
      name: regex, // Tìm kiếm tiêu đề chứa từ khóa
    });

    const offset = 12 * (currentPage - 1);

    const users = await User.find({
      isBan: true,
      name: regex,
    })
      .limit(12)
      .skip(offset)
      .sort({ createdAt: -1 });

    if (!users || users.length === 0) {
      throw {
        code: 1,
        message: "Không có data",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Tìm kiếm thành công",
      count: count,
      data: users,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: searchBanUser",
    });
  }
};

let getNewUserStatistics = async (req, res) => {
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
      isBan: false,
    };

    if (day !== "null" && month && year) {
      const startDate = new Date(`${year}-${month}-${day}`);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    } else if (month !== "null" && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const nextMonth = parseInt(month) + 1;
      const endDate = new Date(`${year}-${nextMonth}-01`);
      query.createdAt = { $gte: startDate, $lt: endDate };
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01`);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const count = await User.countDocuments(query);

    res.status(200).json({
      code: 0,
      message: "Thống kê thành công",
      count: count,
    });
  } catch (error) {
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: getNewUserStatistics",
    });
  }
};

module.exports = {
  allUsers,
  followUser,
  unFollowUser,
  getUnFollowed,
  getFollowings,
  getFollowers,
  getUserInfoById,
  getSavePosts,
  savedPost,
  unSavedPost,
  getSaveDocuments,
  updateProfile,
  searchUnFollowed,
  searchFollowings,
  searchFollowers,
  getSavePostId,

  ///// admin ////
  getAdmin,
  grantAdminRole,
  revokeAdminRole,
  getAllUser,
  searchUserRole,
  searchAdminRole,
  getUserStatistics,
  getUserIsBanStatistics,
  getUserNotBanStatistics,
  banUser,
  unBanUser,
  getBanUser,
  searchBanUser,
  getNewUserStatistics,
};
