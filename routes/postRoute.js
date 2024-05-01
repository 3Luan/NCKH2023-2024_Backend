const express = require("express");
const postController = require("../controllers/postController");
const { checkJWT, checkAdminJWT } = require("../middleware/jwtActions");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/createPost",
  checkJWT,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "files", maxCount: 10 },
  ]),
  postController.createPost
);

router.post(
  "/updatePost",
  checkJWT,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "files", maxCount: 10 },
  ]),
  postController.updatePost
);

router.get("/getPosts/:currentPage", postController.getPosts);

router.get("/searchPost/:currentPage/:keyword", postController.searchPost);
router.get(
  "/searchHistoryPost/:currentPage/:keyword",
  checkJWT,
  postController.searchHistoryPost
);
router.get(
  "/searchUnapprovedPost/:currentPage/:keyword",
  checkJWT,
  postController.searchUnapprovedPost
);

router.get("/getPostDetail/:postId", postController.getPostDetailById);
router.get(
  "/getPostUnApprovedDetailById/:postId",
  checkJWT,
  postController.getPostUnApprovedDetailById
);
router.post("/toggleLikePost", checkJWT, postController.toggleLikePost);
router.get(
  "/getUnapprovedPosts/:currentPage",
  checkJWT,
  postController.getUnapprovedPosts
);
router.get(
  "/getHistoryPosts/:currentPage",
  checkJWT,
  postController.getHistoryPosts
);
router.post("/approvedPost", checkJWT, postController.approvedPost);
router.post("/deletePost", checkJWT, postController.deletePost);

router.get(
  "/searchPostSaved/:currentPage/:keyword",
  checkJWT,
  postController.searchPostSaved
);

// Admin
router.get(
  "/getDeletePosts/:currentPage",
  checkAdminJWT,
  postController.getDeletePosts
);

router.get(
  "/getPostsStatistics/:day/:month/:year",
  checkAdminJWT,
  postController.getPostsStatistics
);

router.get(
  "/getUnapprovedPostsStatistics/:day/:month/:year",
  checkAdminJWT,
  postController.getUnapprovedPostsStatistics
);

router.get(
  "/getapprovedPostsStatistics/:day/:month/:year",
  checkAdminJWT,
  postController.getapprovedPostsStatistics
);

router.get(
  "/getPostDeleteDetailById/:postId",
  checkAdminJWT,
  postController.getPostDeleteDetailById
);
module.exports = router;
