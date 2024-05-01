const express = require("express");
const commentController = require("../controllers/commentController");
const { checkJWT, checkAdminJWT } = require("../middleware/jwtActions");
const router = express.Router();

router.post("/createComment", checkJWT, commentController.createComment);

router.post("/createReply", checkJWT, commentController.createReply);
router.get(
  "/getReplyByCommentId/:commentId",
  commentController.getReplyByCommentId
);

router.get("/getCommentByPostId/:postId", commentController.getCommentByPostId);
router.post("/deleteComment", checkJWT, commentController.deleteComment);

// Admin
router.get(
  "/getDeleteComments/:currentPage",
  checkAdminJWT,
  commentController.getDeleteComments
);
module.exports = router;
