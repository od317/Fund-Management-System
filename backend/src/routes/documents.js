// src/routes/documents.js

const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const upload = require("../config/upload");
const { uploadDocumentSchema } = require("../validators/documentValidators");
const {
  uploadDocument,
  uploadMultipleDocuments,
  getDocuments,
  getDocument,
  downloadDocument,
  verifyDocument,
  deleteDocument,
} = require("../controllers/documentController");

// Upload documents
router.post(
  "/upload",
  upload.single("file"),
  validate(uploadDocumentSchema),
  uploadDocument,
);

router.post(
  "/upload-multiple",
  upload.array("files", 10),
  validate(uploadDocumentSchema),
  uploadMultipleDocuments,
);

// Get documents
router.get("/", getDocuments);
router.get("/:id", getDocument);
router.get("/:id/download", downloadDocument);

// Verify document (Finance Manager only)
router.put("/:id/verify", authorize("view_documents"), verifyDocument);

// Delete document
router.delete("/:id", deleteDocument);

module.exports = router;
