// src/controllers/orderController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Generate order number: ORD-YYYYMMDD-XXXX
 */
const generateOrderNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  // Count orders created today
  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `ORD-${dateStr}-${sequence}`;
};

/**
 * @desc    Get all orders (with filters)
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      startDate,
      endDate,
      search,
      createdBy,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (createdBy) {
      where.createdById = parseInt(createdBy);
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              items: true,
              documents: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        executedBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            isVerified: true,
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        dailyMovements: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create order
 * @route   POST /api/orders
 * @access  Private (Admin, Finance Manager, Employee)
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { type, description, orderDate, reference, notes, items } = req.body;

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate total amount from items
    let totalAmount = 0;
    if (items && items.length > 0) {
      totalAmount = items.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
      }, 0);
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          type,
          amount: totalAmount,
          description,
          status: "DRAFT",
          createdById: req.user.id,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          reference,
          notes,
        },
      });

      // Create order items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              categoryId: item.categoryId,
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice,
              amount: item.quantity * item.unitPrice,
            },
          });
        }
      }

      // Return order with items
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              category: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order (draft only)
 * @route   PUT /api/orders/:id
 * @access  Private (Owner or Admin)
 */
exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, description, orderDate, reference, notes } = req.body;

    // Check if order exists and is in draft status
    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (existingOrder.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft orders can be updated",
      });
    }

    // Check ownership (only creator or admin can update)
    if (
      existingOrder.createdById !== req.user.id &&
      !req.user.role.permissions.all
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own orders",
      });
    }

    // Build update data
    const updateData = {};
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (orderDate) updateData.orderDate = new Date(orderDate);
    if (reference !== undefined) updateData.reference = reference;
    if (notes !== undefined) updateData.notes = notes;

    // Update order
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        items: {
          include: {
            category: true,
          },
        },
        createdBy: {
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
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete order (draft only)
 * @route   DELETE /api/orders/:id
 * @access  Private (Owner or Admin)
 */
exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft orders can be deleted",
      });
    }

    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit order for approval
 * @route   POST /api/orders/:id/submit
 * @access  Private (Owner)
 */
exports.submitOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft orders can be submitted",
      });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must have at least one item before submitting",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status: "PENDING" },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    const socketEventHandler = req.app.get("socketEventHandler");
    if (socketEventHandler) {
      await socketEventHandler.onOrderCreated(updatedOrder);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Order submitted for approval",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve order
 * @route   POST /api/orders/:id/approve
 * @access  Private (Finance Manager, Admin)
 */
exports.approveOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be approved",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: "APPROVED",
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const socketEventHandler = req.app.get("socketEventHandler");
    if (socketEventHandler) {
      await socketEventHandler.onOrderApproved(updatedOrder);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Order approved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject order
 * @route   POST /api/orders/:id/reject
 * @access  Private (Finance Manager, Admin)
 */
exports.rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be rejected",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
        notes: reason ? `Rejected: ${reason}` : order.notes,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    const socketEventHandler = req.app.get("socketEventHandler");
    if (socketEventHandler) {
      await socketEventHandler.onOrderRejected(updatedOrder);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Order rejected",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Execute order
 * @route   POST /api/orders/:id/execute
 * @access  Private (Finance Manager, Admin)
 */
exports.executeOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved orders can be executed",
      });
    }

    // Get current balance
    const lastMovement = await prisma.dailyMovement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const currentBalance = lastMovement ? lastMovement.balanceAfter : 0;
    const newBalance =
      order.type === "INCOME"
        ? currentBalance + Number(order.amount)
        : currentBalance - Number(order.amount);

    // Prevent negative balance for expense orders
    if (order.type === "EXPENSE" && newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance to execute this expense order",
      });
    }

    // Execute in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const executed = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: "EXECUTED",
          executedById: req.user.id,
          executedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          executedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      // Emit socket event after transaction completes
      setTimeout(async () => {
        try {
          const socketEventHandler = req.app.get("socketEventHandler");
          if (socketEventHandler) {
            await socketEventHandler.onOrderExecuted(executed);
          }
        } catch (error) {
          console.error("Socket emit error:", error);
        }
      }, 100);

      // Create daily movement record
      await tx.dailyMovement.create({
        data: {
          orderId: executed.id,
          transactionDate: new Date(),
          amount: order.amount,
          type: order.type,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Order ${order.orderNumber} executed`,
          reference: order.orderNumber,
        },
      });

      return executed;
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Order executed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      createdById: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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
 * @desc    Get pending orders (for Finance Manager)
 * @route   GET /api/orders/pending
 * @access  Private (Finance Manager, Admin)
 */
exports.getPendingOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
