const express = require("express");
const userController = require("../controllers/userController");
const { checkJWT, checkAdminJWT } = require("../middleware/jwtActions");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/").get(checkJWT, userController.allUsers);

router.post(
  "/updateProfile",
  checkJWT,
  upload.fields([{ name: "pic", maxCount: 1 }]),
  userController.updateProfile
);

router.get(
  "/getunfollowed/:currentPage",
  checkJWT,
  userController.getUnFollowed
);
router.get(
  "/getfollowings/:currentPage",
  checkJWT,
  userController.getFollowings
);
router.get("/getfollowers/:currentPage", checkJWT, userController.getFollowers);
router.post("/follow", checkJWT, userController.followUser);
router.post("/unfollow", checkJWT, userController.unFollowUser);
router.get(
  "/getuserinfobyid/:userId",
  checkJWT,
  userController.getUserInfoById
);

router.get("/getSavePosts/:currentPage", checkJWT, userController.getSavePosts);
router.get(
  "/getSaveDocuments/:currentPage",
  checkJWT,
  userController.getSaveDocuments
);

router.post("/savedPost", checkJWT, userController.savedPost);

router.post("/unSavedPost", checkJWT, userController.unSavedPost);

router.get(
  "/searchUnFollowed/:currentPage/:keyword",
  checkJWT,
  userController.searchUnFollowed
);

router.get(
  "/searchFollowings/:currentPage/:keyword",
  checkJWT,
  userController.searchFollowings
);

router.get(
  "/searchFollowers/:currentPage/:keyword",
  checkJWT,
  userController.searchFollowers
);

router.get("/getSavePostId", checkJWT, userController.getSavePostId);

//////////////////////// Admin //////////////////////
router.get("/getAdmin/:currentPage", checkAdminJWT, userController.getAdmin);
router.get(
  "/getAllUser/:currentPage",
  checkAdminJWT,
  userController.getAllUser
);

router.post("/grantAdminRole", checkAdminJWT, userController.grantAdminRole);
router.post("/revokeAdminRole", checkAdminJWT, userController.revokeAdminRole);

router.get(
  "/searchUserRole/:currentPage/:keyword",
  checkAdminJWT,
  userController.searchUserRole
);
router.get(
  "/searchAdminRole/:currentPage/:keyword",
  checkAdminJWT,
  userController.searchAdminRole
);

router.get(
  "/getUserStatistics",
  checkAdminJWT,
  userController.getUserStatistics
);

router.get(
  "/getUserIsBanStatistics",
  checkAdminJWT,
  userController.getUserIsBanStatistics
);

router.get(
  "/getUserNotBanStatistics",
  checkAdminJWT,
  userController.getUserNotBanStatistics
);

router.post("/banUser", checkAdminJWT, userController.banUser);
router.post("/unBanUser", checkAdminJWT, userController.unBanUser);
router.get(
  "/getBanUser/:currentPage",
  checkAdminJWT,
  userController.getBanUser
);
router.get(
  "/searchBanUser/:currentPage/:keyword",
  checkAdminJWT,
  userController.searchBanUser
);

router.get(
  "/getNewUserStatistics/:day/:month/:year",
  checkAdminJWT,
  userController.getNewUserStatistics
);

module.exports = router;
