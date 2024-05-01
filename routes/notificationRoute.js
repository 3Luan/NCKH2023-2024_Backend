const express = require("express");
const notificationController = require("../controllers/notificationController");
const { checkJWT } = require("../middleware/jwtActions");
const router = express.Router();

router.get(
  "/getNotifications/:currentPage",
  checkJWT,
  notificationController.getNotifications
);

router.post(
  "/readNotification",
  checkJWT,
  notificationController.readNotification
);

module.exports = router;
