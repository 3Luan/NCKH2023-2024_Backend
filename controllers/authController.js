const jwtActions = require("../middleware/jwtActions");
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const passport = require("passport");
require("dotenv").config();
const verificationCodeModel = require("../models/verificationCodeModel");
const sendMail = require("../utils/sendEmail");

let register = async (req, res) => {
  try {
    const { name, email, password, gender, birth } = req.body;

    if (!name || !email || !password || !gender || !birth) {
      throw {
        code: 1,
        message: "Không được bỏ trống thông tin",
      };
    }

    let user = await userModel.findOne({ email });

    if (user) {
      throw {
        code: 1,
        message: "Email đã tồn tại",
      };
    }

    // Kiểm tra xem địa chỉ email đã tồn tại trong cơ sở dữ liệu chưa
    const existingVerificationCode = await verificationCodeModel.findOne({
      email,
    });

    const generateNewVerificationCode = () => {
      return Math.random().toString(36).slice(2, 8).toUpperCase();
    };

    if (existingVerificationCode) {
      // Nếu địa chỉ email đã tồn tại, cập nhật lại mã xác thực mới
      existingVerificationCode.code = generateNewVerificationCode();
      await existingVerificationCode.save();

      // Gửi lại mã xác thực qua email
      await sendMail(email, existingVerificationCode.code);

      res.status(200).json({
        code: 0,
        message: "Mã xác thực mới đã được gửi lại",
      });
    } else {
      // Nếu địa chỉ email chưa tồn tại, tạo bản ghi mới
      const verificationCode = generateNewVerificationCode();
      await verificationCodeModel.create({ email, code: verificationCode });

      // Gửi mã xác thực qua email
      await sendMail(email, verificationCode);

      res.status(200).json({
        code: 0,
        message: "Vui lòng kiểm tra email để nhận mã xác thực",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: Register",
    });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { code, name, email, password, gender, birth } = req.body;

    if (!code || !name || !email || !password || !gender || !birth) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      };
    }

    let user = await userModel.findOne({ email });

    if (user) {
      throw {
        code: 1,
        message: "Email đã tồn tại",
      };
    }

    // Tìm mã xác thực trong cơ sở dữ liệu
    const verificationCode = await verificationCodeModel.findOne({
      email,
      code,
    });

    if (!verificationCode) {
      throw {
        code: 1,
        message: "Mã xác thực không hợp lệ",
      };
    }

    // Kiểm tra xem mã xác thực có hết hạn không (nếu có)
    const expirationTime = 15 * 60 * 1000; // Thời gian hết hạn của mã xác thực (miligiây), ví dụ 24 giờ
    const currentTime = new Date();
    const codeTime = verificationCode.createdAt.getTime();
    if (currentTime - codeTime > expirationTime) {
      throw {
        code: 1,
        message: "Mã xác thực đã hết hạn",
      };
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Chuyển chuỗi ngày thành kiểu dữ liệu Date
    const birthDate = new Date(birth);
    user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      gender,
      birth: birthDate, // Lưu giá trị kiểu Date vào trường birth
    });

    let payload = {
      id: user._id,
    };

    const token = jwtActions.createJWT(payload);

    // Lưu token vào cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    // });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 * 365, // 1 năm
      sameSite: "none",
      secure: true,
    });

    // Xóa mã xác thực sau khi đã được sử dụng
    await verificationCodeModel.deleteOne({ email, code });

    res.status(200).json({
      code: 0,
      message: "Đăng ký thành công",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra khi xác thực mã",
    });
  }
};

const sendForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      };
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      throw {
        code: 1,
        message: "Email này chưa đăng ký tài khoản",
      };
    }

    // Kiểm tra xem địa chỉ email đã tồn tại trong cơ sở dữ liệu chưa
    const existingVerificationCode = await verificationCodeModel.findOne({
      email,
    });

    const generateNewVerificationCode = () => {
      return Math.random().toString(36).slice(2, 8).toUpperCase();
    };

    if (existingVerificationCode) {
      // Nếu địa chỉ email đã tồn tại, cập nhật lại mã xác thực mới
      existingVerificationCode.code = generateNewVerificationCode();
      await existingVerificationCode.save();

      // Gửi lại mã xác thực qua email
      await sendMail(email, existingVerificationCode.code);

      res.status(200).json({
        code: 0,
        message: "Mã xác thực mới đã được gửi lại",
      });
    } else {
      // Nếu địa chỉ email chưa tồn tại, tạo bản ghi mới
      const verificationCode = generateNewVerificationCode();

      await verificationCodeModel.create({ email, code: verificationCode });

      // Gửi mã xác thực qua email
      await sendMail(email, verificationCode);

      res.status(200).json({
        code: 0,
        message: "Vui lòng kiểm tra email để nhận mã xác thực",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: sendForgotPassword",
    });
  }
};

const verifyCodeForgotPassword = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      };
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      throw {
        code: 1,
        message: "Email này chưa đăng ký tài khoản",
      };
    }

    // Tìm mã xác thực trong cơ sở dữ liệu
    const verificationCode = await verificationCodeModel.findOne({
      email,
      code,
    });

    if (!verificationCode) {
      throw {
        code: 1,
        message: "Mã xác thực không hợp lệ",
      };
    }

    // Kiểm tra xem mã xác thực có hết hạn không (nếu có)
    const expirationTime = 15 * 60 * 1000; // Thời gian hết hạn của mã xác thực (miligiây), ví dụ 24 giờ
    const currentTime = new Date();
    const codeTime = verificationCode.createdAt.getTime();
    if (currentTime - codeTime > expirationTime) {
      throw {
        code: 1,
        message: "Mã xác thực đã hết hạn",
      };
    }

    // Xóa mã xác thực sau khi đã được sử dụng
    await verificationCodeModel.deleteOne({ email, code });

    res.status(200).json({
      code: 0,
      message: "Xác thực thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: verifyCodeForgotPassword",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      };
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      throw {
        code: 1,
        message: "Email này chưa đăng ký tài khoản",
      };
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu mới vào cơ sở dữ liệu
    user.password = hashedPassword;
    await user.save();

    let payload = {
      id: user._id,
    };

    const token = jwtActions.createJWT(payload);

    // Lưu token vào cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    // });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 * 365, // 1 năm
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      code: 0,
      message: "Đặt lại mật khẩu thành công",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Lỗi: forgotPassword",
    });
  }
};

let login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw {
        code: 1,
        message: "Không được bỏ trống thông tin",
      };
    }

    let user = await userModel.findOne({ email });

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

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa",
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
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   maxAge: 24 * 60 * 60 * 1000 * 365, // 1 năm
    // });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 * 365, // 1 năm
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
    // res.clearCookie("token");
    res.cookie("token", "", {
      httpOnly: true,
      maxAge: -1, // hoặc sử dụng expires: new Date(0)
      sameSite: "none",
      secure: true,
    });

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
    const userId = req.userId;

    if (!userId) {
      throw {
        code: 1,
        message: "Đã có lỗi xảy ra khi refresh: Không tìm thấy userId",
      };
    }

    let user = await userModel.findById(userId);

    if (!user) {
      throw {
        code: 1,
        message: "Đã có lỗi xảy ra khi refresh: Không tìm thấy user",
      };
    }

    if (user.isBan) {
      throw {
        code: 1,
        message: "Tài khoản này đã bị khóa",
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

const loginWithGoogle = (req, res, next) => {
  passport.authenticate("google", { scope: ["email", "profile"] })(
    req,
    res,
    next
  );
};

const loginWithGoogleCallback = (req, res, next) => {
  passport.authenticate("google", async (profile) => {
    // Logic xử lý sau khi đăng nhập thành công
    try {
      if (!profile) {
        throw {
          code: 1,
          message: "Đăng nhập thất bại. Hãy thử lại",
        };
      }

      let user = await userModel.findById(profile.id);

      if (user) {
        user.name = profile.displayName;
        user.email = profile.emails;
        user.pic = profile.photos[0].value;
      } else {
        user = await userModel.create({
          _id: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          pic: profile.photos[0].value,
        });
      }

      if (!user) {
        user = await userModel.create({
          _id: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          pic: profile.photos[0].value,
        });
      }

      if (user.isBan) {
        throw {
          code: 1,
          message: "Tài khoản này đã bị khóa",
        };
      }

      let payload = {
        id: user._id,
      };

      const token = jwtActions.createJWT(payload);

      // Lưu token vào cookie
      // res.cookie("token", token, {
      //   httpOnly: true,
      //   maxAge: 24 * 60 * 60 * 1000 * 365, // 1 năm
      // });

      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 * 365, // 1 năm
        sameSite: "none",
        secure: true,
      });

      res.redirect(`${process.env.URL_FRONTEND}`);
    } catch (error) {
      console.log(error);

      res.redirect(`${process.env.HOST_NAME}/api/auth/google`);
    }
  })(req, res, next);
};

let updatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { passwordOld, passwordNew } = req.body;

    if (!passwordOld || !passwordNew) {
      throw {
        code: 1,
        message: "Lỗi: Thông tin không đủ",
      };
    }

    const user = await userModel.findById(userId);

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

    const isPasswordValid = await bcrypt.compare(passwordOld, user.password);

    if (!isPasswordValid) {
      throw {
        code: 1,
        message: "Tài khoản hoặc mật khẩu không chính xác",
      };
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(passwordNew, 10);

    // Xác định các ID của các hình ảnh cũ từ đối tượng imagesOld
    let updateData = {
      user: userId,
      password: hashedPassword,
    };

    await userModel.updateOne({ _id: userId }, updateData);

    res.status(200).json({
      code: 0,
      message: "Thay đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: error.code || 1,
      message: error.message || "Đã có lỗi xảy ra: updatePassword",
    });
  }
};

module.exports = {
  register,
  verifyCode,
  sendForgotPassword,
  verifyCodeForgotPassword,
  forgotPassword,
  login,
  refresh,
  logout,
  loginWithGoogle,
  loginWithGoogleCallback,
  updatePassword,
};
