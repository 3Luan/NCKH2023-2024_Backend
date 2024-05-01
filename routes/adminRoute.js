const express = require("express");
const adminController = require("../controllers/adminController");
const { checkAdminJWT } = require("../middleware/jwtActions");
const router = express.Router();

router.post("/login", adminController.login);
router.post("/refresh", checkAdminJWT, adminController.refresh);
router.post("/logout", adminController.logout);

module.exports = router;
