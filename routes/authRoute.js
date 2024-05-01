const express = require("express");
const authController = require("../controllers/authController");
const { checkJWT } = require("../middleware/jwtActions");
const router = express.Router();

router.post("/register", authController.register);
router.post("/verifyCode", authController.verifyCode);

router.post("/sendForgotPassword", authController.sendForgotPassword);
router.post(
  "/verifyCodeForgotPassword",
  authController.verifyCodeForgotPassword
);
router.post("/forgotPassword", authController.forgotPassword);

router.post("/login", authController.login);
router.post("/refresh", checkJWT, authController.refresh);
router.post("/logout", authController.logout);

router.get("/google", authController.loginWithGoogle);
router.get("/google/callback", authController.loginWithGoogleCallback);

router.post("/updatePassword", checkJWT, authController.updatePassword);

module.exports = router;
