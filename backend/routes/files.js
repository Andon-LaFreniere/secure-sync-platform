const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const File = require("../models/File");
const authMiddleware = require("../middleware/auth");
const EncryptionUtils = require("../utils/encryption");

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload file
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Encrypt file
      const encrypted = EncryptionUtils.encrypt(req.file.buffer);

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const s3Key = `files/${req.user._id}/${filename}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: encrypted.encryptedData,
        ContentType: "application/octet-stream",
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      // Save file metadata to database
      const file = new File({
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        owner: req.user._id,
        s3Key,
        encryptionIV: encrypted.iv,
      });

      await file.save();

      res.status(201).json({
        message: "File uploaded successfully",
        file: {
          id: file._id,
          filename: file.originalName,
          size: file.size,
          uploadDate: file.createdAt,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  }
);

// Get user's files
router.get("/my-files", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id })
      .select("-s3Key -encryptionIV")
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Download file
router.get("/download/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if user owns the file or if it's public
    if (file.owner.toString() !== req.user._id.toString() && !file.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Download from S3
    const downloadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.s3Key,
    };

    try {
      const s3Object = await s3.getObject(downloadParams).promise();

      // Decrypt file
      const decryptedBuffer = EncryptionUtils.decrypt(
        s3Object.Body,
        file.encryptionIV
      );

      // Update download count
      file.downloadCount += 1;
      await file.save();

      // Send file
      res.set({
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
      });

      res.send(decryptedBuffer);
    } catch (s3Error) {
      console.error("S3 download error:", s3Error);
      res.status(500).json({ error: "Failed to download file from storage" });
    }
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

// Delete file
router.delete("/:fileId", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if user owns the file
    if (file.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete from S3
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.s3Key,
    };

    await s3.deleteObject(deleteParams).promise();

    // Delete from database
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

module.exports = router;
