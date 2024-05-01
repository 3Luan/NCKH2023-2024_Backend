const express = require("express");
const authRoute = require("./authRoute");
const adminRoute = require("./adminRoute");
const postRoute = require("./postRoute");
const documentRoute = require("./documentRoute");
const commentRoute = require("./commentRoute");
const userRoute = require("./userRoute");
const chatRoute = require("./chatRoute");
const messageRoutes = require("./messageRoute");
const notificationRoute = require("./notificationRoute");

let initRoutes = (app) => {
  app.use("/api/user", userRoute);
  app.use("/api/auth", authRoute);
  app.use("/api/post", postRoute);
  app.use("/api/document", documentRoute);
  app.use("/api/comment", commentRoute);
  app.use("/api/chat", chatRoute);
  app.use("/api/message", messageRoutes);
  app.use("/api/notification", notificationRoute);

  // Admin
  app.use("/api/admin", adminRoute);

  return app;
};

module.exports = initRoutes;
