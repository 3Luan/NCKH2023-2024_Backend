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

router.post(
  "/readAllNotification",
  checkJWT,
  notificationController.readAllNotification
);

router.get(
  "/getUnreadNotification",
  checkJWT,
  notificationController.getUnreadNotification
);

module.exports = router;
