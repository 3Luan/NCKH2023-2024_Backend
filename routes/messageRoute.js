const express = require("express");
const messageController = require("../controllers/messageController");
const { checkJWT } = require("../middleware/jwtActions");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/:chatId").get(checkJWT, messageController.allMessages);

// router.route("/").post(checkJWT, messageController.sendMessage);

router.route("/").post(
  checkJWT,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "files", maxCount: 10 },
  ]),
  messageController.sendMessage
);

module.exports = router;
