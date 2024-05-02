const express = require("express");
const initRoutes = require("./routes/initRoutes");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
app.use(express.json());
const cors = require("cors");
require("./config/passport");
const path = require("path"); // Để xử lý đường dẫn tệp

// Cấu hình các tệp tĩnh từ thư mục uploads
app.use(express.static("uploads/images"));
app.use(express.static("uploads/files"));

const PORT = process.env.PORT;
const HOST_NAME = process.env.HOST_NAME;
const URL_FRONTEND = process.env.URL_FRONTEND;

// Cấu hình CORS middleware
app.use(
  cors({
    origin: { URL_FRONTEND }, // Chỉ định miền nguồn cho phép
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Các phương thức HTTP cho phép
    credentials: true, // Cho phép chia sẻ cookie và thông tin xác thực qua các miền khác nhau
    optionsSuccessStatus: 204, // Cho phép trả về status code 204 khi pre-flight request thành công
  })
);

// config req.body
app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true })); // for form data

// config cookie parser
app.use(cookieParser());

// config routes
initRoutes(app);

// config database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on: ${HOST_NAME}:${PORT}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://utc2social.vercel.app",
    // // credentials: true,

    // origin: { URL_FRONTEND }, // Chỉ định miền nguồn cho phép
    // methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Các phương thức HTTP cho phép
    // credentials: true, // Cho phép chia sẻ cookie và thông tin xác thực qua các miền khác nhau
    // optionsSuccessStatus: 204, // Cho phép trả về status code 204 khi pre-flight request thành công
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData.id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  // socket.on("typing", (room) => socket.in(room).emit("typing"));
  // socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    // console.log("chat", chat);
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      // console.log(user);
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData.id);
  });
});
