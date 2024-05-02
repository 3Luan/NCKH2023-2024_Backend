const Message = require("../models/messageModel");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Chat = require("../models/chatModel");
const imageUploadPath = path.join("uploads/images");
const fileUploadPath = path.join("uploads/files");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = async (req, res) => {
  try {
    // Lấy số lượng tin nhắn cần hiển thị từ tham số query
    let limit = parseInt(req.query.limit); // Nếu không có giá trị limit trong query parameter, mặc định là 10

    // Tính toán số tin nhắn cần bỏ qua dựa trên limit
    const skip = limit - 10;
    // Tìm tất cả các tin nhắn trong cuộc trò chuyện cụ thể, giới hạn bởi số lượng tin nhắn cần hiển thị và số tin nhắn cần bỏ qua
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .skip(skip)
      .limit(10)
      .sort({ createdAt: -1 });

    res.json(messages.reverse());
  } catch (error) {
    res.status(400).send(error.message);
  }
};

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;
  const images = req.files.images || [];
  const files = req.files.files || [];

  // Kiểm tra xem người dùng hiện tại có trong cuộc trò chuyện không
  const chat = await Chat.findById(chatId).populate("users", "_id");
  const isUserInChat = chat.users.some(
    (user) => user._id.toString() === req.userId
  );

  if (!isUserInChat) {
    return res.status(200).json({
      code: 1,
      message: "Bạn không tồn tại trong cuộc trò chuyện này",
    });
  }

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
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

  var newMessage = {
    sender: req.userId,
    content: content,
    images: imagePaths,
    files: filePaths,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = { allMessages, sendMessage };
