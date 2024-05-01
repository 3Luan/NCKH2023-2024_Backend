const express = require("express");
const documentController = require("../controllers/documentController");
const { checkJWT, checkAdminJWT } = require("../middleware/jwtActions");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/createDocument",
  checkJWT,
  upload.fields([{ name: "files", maxCount: 1 }]),
  documentController.createDocument
);

router.post(
  "/updateDocument",
  checkJWT,
  upload.fields([{ name: "files", maxCount: 1 }]),
  documentController.updateDocument
);

router.get("/getDocuments/:currentPage", documentController.getDocuments);

router.get(
  "/searchDocument/:currentPage/:keyword",
  documentController.searchDocument
);

router.get(
  "/searchHistoryDocument/:currentPage/:keyword",
  checkJWT,
  documentController.searchHistoryDocument
);

router.get(
  "/searchUnApprovedDocument/:currentPage/:keyword",
  checkJWT,
  documentController.searchUnApprovedDocument
);

router.get(
  "/getDocumentDetail/:documentId",
  documentController.getDocumentDetailById
);
router.get(
  "/getDocumentUnApprovedDetailById/:documentId",
  checkJWT,
  documentController.getDocumentUnApprovedDetailById
);
router.post(
  "/toggleLikeDocument",
  checkJWT,
  documentController.toggleLikeDocument
);
router.get(
  "/getUnapprovedDocuments/:currentPage",
  checkJWT,
  documentController.getUnapprovedDocuments
);
router.get(
  "/getHistoryDocuments/:currentPage",
  checkJWT,
  documentController.getHistoryDocuments
);
router.post("/approvedDocument", checkJWT, documentController.approvedDocument);
router.post("/deleteDocument", checkJWT, documentController.deleteDocument);

router.get(
  "/searchDocumentSaved/:currentPage/:keyword",
  checkJWT,
  documentController.searchDocumentSaved
);

// Admin
router.get(
  "/getDeleteDocuments/:currentPage",
  checkAdminJWT,
  documentController.getDeleteDocuments
);

router.get(
  "/getDocumentStatistics/:day/:month/:year",
  checkAdminJWT,
  documentController.getDocumentStatistics
);

router.get(
  "/getUnapprovedDocumentStatistics/:day/:month/:year",
  checkAdminJWT,
  documentController.getUnapprovedDocumentStatistics
);

router.get(
  "/getApprovedDocumentStatistics/:day/:month/:year",
  checkAdminJWT,
  documentController.getApprovedDocumentStatistics
);

router.get(
  "/getDocumentDeleteDetailById/:documentId",
  checkAdminJWT,
  documentController.getDocumentDeleteDetailById
);

module.exports = router;
