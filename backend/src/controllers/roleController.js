// src/controllers/roleController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc    Get all roles
 * @route   GET /api/roles
 * @access  Private/Admin
 */
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      usersCount: role._count.users,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedRoles.length,
      data: formattedRoles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single role
 * @route   GET /api/roles/:id
 * @access  Private/Admin
 */
exports.getRole = async (req, res, next) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create role
 * @route   POST /api/roles
 * @access  Private/Admin
 */
exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists",
      });
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        description: description || "",
        permissions: permissions || {},
      },
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update role
 * @route   PUT /api/roles/:id
 * @access  Private/Admin
 */
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check for duplicate name
    if (name && name !== existingRole.name) {
      const duplicateRole = await prisma.role.findUnique({
        where: { name },
      });

      if (duplicateRole) {
        return res.status(400).json({
          success: false,
          message: "Role with this name already exists",
        });
      }
    }

    // Update role
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions;

    const role = await prisma.role.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete role
 * @route   DELETE /api/roles/:id
 * @access  Private/Admin
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if role exists and has users
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Prevent deletion of roles with users
    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${role._count.users} user(s) are assigned to this role. Reassign users first.`,
      });
    }

    // Delete role
    await prisma.role.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
