const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports = async (email, verificationCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "smtp.gmail.com",
      post: 587,
      secure: false,
      auth: {
        user: "utc2nckh@gmail.com",
        pass: "lacj gvrc tion qdie",
      },
    });

    // Nội dung email
    let mailOptions = {
      from: {
        name: "UTC2 Social",
        address: "utc2nckh@gmail.com",
      },
      to: email,
      subject: "Mã xác thực",
      html: `
      <div style="font-family: Arial, sans-serif; display: inline-block; background-color: #f9f9f9; padding: 20px;">
        <div style="display: inline-block; background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #f5f5f5; border: 1px solid #dddddd; padding: 10px; border-radius: 5px; display: flex; align-items: center;">
            <h3 style="color: #333333; margin-top: 0; margin-bottom: 0;">Mã xác thực:</h3>
            <p style="color: #facb01; font-size: 18px; font-weight: bold; margin: 0; margin-left: 10px;">${verificationCode}</p>
          </div>
        </div>
      </div>
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);
    console.log("Email sent Successfully");
  } catch (error) {
    console.log("Email not sent");
    console.log(error);
  }
};
