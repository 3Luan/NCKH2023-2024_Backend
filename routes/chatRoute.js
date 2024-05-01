const express = require("express");
const chatController = require("../controllers/chatController");
const { checkJWT } = require("../middleware/jwtActions");
const router = express.Router();

router.route("/").post(checkJWT, chatController.accessChat);
router.route("/").get(checkJWT, chatController.fetchChats);
router.route("/group").post(checkJWT, chatController.createGroupChat);
router.route("/rename").put(checkJWT, chatController.renameGroup);
router.route("/groupremove").put(checkJWT, chatController.removeFromGroup);
router.route("/groupadd").put(checkJWT, chatController.addToGroup);

module.exports = router;
