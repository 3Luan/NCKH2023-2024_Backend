const jwtActions = require("../middleware/jwtActions");
const adminModel = require("../models/adminModel");
const bcrypt = require("bcrypt");
const passport = require("passport");
require("dotenv").config();

let login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw {
        code: 1,
        message: "Không được bỏ trống thông tin",
      };
    }

    let user = await adminModel.findOne({ username });

    if (!user) {
      throw {
        code: 1,
        message: "Tài khoản hoặc mật khẩu không chính xác",
      };
    }

    if (!user.password) {
      throw {
        code: 1,
        message: "Tài khoản hoặc mật khẩu không chính xác",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw {
        code: 1,
        message: "Tài khoản hoặc mật khẩu không chính xác",
      };
    }

    let payload = {
      id: user._id,
    };

    const token = jwtActions.createJWT(payload);

    // Lưu token vào cookie
    // res.cookie("tokenAdmin", token, {
    //   httpOnly: true,
    //   maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    // });

    res.cookie("tokenAdmin", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      code: 0,
      message: "Đăng nhập thành công",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: Login",
    });
  }
};

let logout = async (req, res) => {
  try {
    // xóa cookie
    res.clearCookie("tokenAdmin");

    res.status(200).json({
      code: 0,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: Logout",
    });
  }
};

let refresh = async (req, res) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      throw {
        code: 1,
        message: "Đã có lỗi xảy ra khi refresh: Không tìm thấy userId",
      };
    }

    let user = await adminModel.findById(adminId);

    if (!user) {
      throw {
        code: 1,
        message: "Đã có lỗi xảy ra khi refresh: Không tìm thấy user",
      };
    }

    res.status(200).json({
      code: 0,
      message: "Refresh thành công",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: Refresh",
    });
  }
};

module.exports = {
  login,
  refresh,
  logout,
};
