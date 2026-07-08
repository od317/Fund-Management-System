// src/controllers/categoryController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
exports.getCategories = async (req, res, next) => {
  try {
    const { type, isActive, parentId } = req.query;

    // Build filter
    const where = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (parentId) {
      where.parentId = parseInt(parentId);
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Private
 */
exports.getCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, type, parentId, description } = req.body;

    // Check if category name already exists for the same type
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        type,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists for this type",
      });
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }

      if (parent.type !== type) {
        return res.status(400).json({
          success: false,
          message: "Parent category must be of the same type",
        });
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        type,
        parentId: parentId || null,
        description: description || "",
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Make sure req.body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided to update",
      });
    }

    const { name, type, parentId, description, isActive } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check for duplicate name
    if (name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name,
          type: type || existingCategory.type,
          id: { not: parseInt(id) },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
    }

    // Build update data (only include provided fields)
    const updateData = {};
    if (name !== undefined && name !== null) updateData.name = name;
    if (type !== undefined && type !== null) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined && isActive !== null)
      updateData.isActive = isActive;
    if (parentId !== undefined && parentId !== null)
      updateData.parentId = parentId;

    console.log("📝 Update data:", updateData); // Debug log

    // Update category
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists and has items/children
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            orderItems: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Prevent deletion if category is in use
    if (category._count.orderItems > 0 || category._count.children > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${category._count.orderItems} order items and ${category._count.children} subcategories. Remove them first.`,
      });
    }

    // Delete category
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
