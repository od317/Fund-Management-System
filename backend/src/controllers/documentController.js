// src/controllers/documentController.js

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

/**
 * @desc    Upload document
 * @route   POST /api/documents/upload
 * @access  Private
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    const { orderId, description } = req.body;

    // Validate order exists
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
      });

      if (!order) {
        // Delete uploaded file if order doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        orderId: orderId ? parseInt(orderId) : null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedById: req.user.id,
        description: description || "",
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // Delete file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * @desc    Upload multiple documents
 * @route   POST /api/documents/upload-multiple
 * @access  Private
 */
exports.uploadMultipleDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one file",
      });
    }

    const { orderId, description } = req.body;
    const documents = [];

    // Validate order if provided
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
      });

      if (!order) {
        // Clean up uploaded files
        req.files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
    }

    // Create document records for each file
    for (const file of req.files) {
      const document = await prisma.document.create({
        data: {
          orderId: orderId ? parseInt(orderId) : null,
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          uploadedById: req.user.id,
          description: description || "",
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      });
      documents.push(document);
    }

    res.status(201).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    // Clean up files on error
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all documents
 * @route   GET /api/documents
 * @access  Private
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const { orderId, isVerified, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === "true";
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          verifiedBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document
 * @route   GET /api/documents/:id
 * @access  Private
 */
exports.getDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download document
 * @route   GET /api/documents/:id/download
 * @access  Private
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Send file
    res.download(document.filePath, document.fileName);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify document (Finance Manager)
 * @route   PUT /api/documents/:id/verify
 * @access  Private (Finance Manager, Admin)
 */
exports.verifyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Document is already verified",
      });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: parseInt(id) },
      data: {
        isVerified: true,
        verifiedById: req.user.id,
        verifiedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedDocument,
      message: "Document verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private (Owner or Admin)
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership
    if (
      document.uploadedById !== req.user.id &&
      !req.user.role.permissions.all
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own documents",
      });
    }

    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
