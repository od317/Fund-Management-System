// src/controllers/reportController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc    Daily Movement Reconciliation
 * @route   GET /api/reports/daily-movement
 * @access  Private (Admin)
 * @description Shows daily cash movements and reveals pending/unauthorized orders
 */
exports.getDailyMovementReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    // Get daily movements
    const movements = await prisma.dailyMovement.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: { transactionDate: "desc" },
    });

    // Calculate summary
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netMovement: 0,
      transactionCount: movements.length,
    };

    movements.forEach((movement) => {
      if (movement.type === "INCOME") {
        summary.totalIncome += Number(movement.amount);
      } else {
        summary.totalExpense += Number(movement.amount);
      }
    });

    summary.netMovement = summary.totalIncome - summary.totalExpense;

    // Get pending orders (unauthorized)
    const pendingOrders = await prisma.order.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        orderNumber: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
        createdBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // Get today's balance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMovements = await prisma.dailyMovement.findMany({
      where: {
        transactionDate: {
          gte: today,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const currentBalance =
      todayMovements.length > 0 ? todayMovements[0].balanceAfter : 0;

    res.status(200).json({
      success: true,
      data: {
        currentBalance: Number(currentBalance),
        todayMovements,
        summary,
        pendingOrders,
        movements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Financial Summary
 * @route   GET /api/reports/financial-summary
 * @access  Private (Admin, Investor)
 * @description Income, expenses, cash balance overview
 */
exports.getFinancialSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    // Get all executed orders
    const orderWhere = {
      status: "EXECUTED",
    };

    if (startDate || endDate) {
      orderWhere.executedAt = {};
      if (startDate) orderWhere.executedAt.gte = new Date(startDate);
      if (endDate) orderWhere.executedAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      orderBy: { executedAt: "asc" },
    });

    // Calculate totals
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      orderCount: orders.length,
      incomeCount: 0,
      expenseCount: 0,
    };

    orders.forEach((order) => {
      if (order.type === "INCOME") {
        summary.totalIncome += Number(order.amount);
        summary.incomeCount++;
      } else {
        summary.totalExpense += Number(order.amount);
        summary.expenseCount++;
      }
    });

    summary.netProfit = summary.totalIncome - summary.totalExpense;

    // Group by date for charts
    const groupedData = {};
    orders.forEach((order) => {
      const dateKey = order.executedAt.toISOString().split("T")[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          income: 0,
          expense: 0,
          net: 0,
        };
      }
      if (order.type === "INCOME") {
        groupedData[dateKey].income += Number(order.amount);
      } else {
        groupedData[dateKey].expense += Number(order.amount);
      }
      groupedData[dateKey].net =
        groupedData[dateKey].income - groupedData[dateKey].expense;
    });

    // Get current balance
    const lastMovement = await prisma.dailyMovement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const currentBalance = lastMovement ? lastMovement.balanceAfter : 0;

    res.status(200).json({
      success: true,
      data: {
        currentBalance: Number(currentBalance),
        summary,
        dailyBreakdown: Object.values(groupedData),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Income/Expense Analysis
 * @route   GET /api/reports/income-expense-analysis
 * @access  Private (Admin, Investor)
 * @description Category-wise breakdown of income and expenses
 */
exports.getIncomeExpenseAnalysis = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const orderWhere = {
      status: "EXECUTED",
    };

    if (type) {
      orderWhere.type = type;
    }

    if (startDate || endDate) {
      orderWhere.executedAt = {};
      if (startDate) orderWhere.executedAt.gte = new Date(startDate);
      if (endDate) orderWhere.executedAt.lte = new Date(endDate);
    }

    // Get orders with items and categories
    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    // Group by category
    const categoryBreakdown = {};
    let totalAmount = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryName = item.category.name;
        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = {
            category: categoryName,
            type: item.category.type,
            amount: 0,
            count: 0,
            percentage: 0,
          };
        }
        categoryBreakdown[categoryName].amount += Number(item.amount);
        categoryBreakdown[categoryName].count += item.quantity;
        totalAmount += Number(item.amount);
      });
    });

    // Calculate percentages
    const breakdown = Object.values(categoryBreakdown).map((item) => ({
      ...item,
      percentage:
        totalAmount > 0
          ? parseFloat(((item.amount / totalAmount) * 100).toFixed(2))
          : 0,
    }));

    // Separate income and expense
    const incomeBreakdown = breakdown.filter((item) => item.type === "INCOME");
    const expenseBreakdown = breakdown.filter(
      (item) => item.type === "EXPENSE",
    );

    res.status(200).json({
      success: true,
      data: {
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        incomeCategories: incomeBreakdown,
        expenseCategories: expenseBreakdown,
        allCategories: breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Orders & Document Status
 * @route   GET /api/reports/orders-documents
 * @access  Private (Admin)
 * @description Orders without required documents
 */
exports.getOrdersDocumentsStatus = async (req, res, next) => {
  try {
    // Get all orders with document counts
    const orders = await prisma.order.findMany({
      where: {
        status: {
          not: "DRAFT",
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Categorize orders
    const ordersWithDocs = [];
    const ordersWithoutDocs = [];
    const pendingVerification = [];

    for (const order of orders) {
      const orderData = {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        amount: Number(order.amount),
        status: order.status,
        createdBy: order.createdBy.fullName,
        documentCount: order._count.documents,
        createdAt: order.createdAt,
      };

      if (order._count.documents === 0) {
        ordersWithoutDocs.push(orderData);
      } else {
        ordersWithDocs.push(orderData);
      }

      // Check for unverified documents
      const unverifiedDocs = await prisma.document.count({
        where: {
          orderId: order.id,
          isVerified: false,
        },
      });

      if (unverifiedDocs > 0) {
        pendingVerification.push({
          ...orderData,
          unverifiedDocuments: unverifiedDocs,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: orders.length,
          ordersWithDocuments: ordersWithDocs.length,
          ordersWithoutDocuments: ordersWithoutDocs.length,
          pendingVerification: pendingVerification.length,
        },
        ordersWithoutDocuments: ordersWithoutDocs,
        pendingVerification,
        allOrders: orders.map((o) => ({
          ...o,
          amount: Number(o.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pending Commitments
 * @route   GET /api/reports/pending-commitments
 * @access  Private (Admin, Investor)
 * @description Required liquidity - approved but not executed orders
 */
exports.getPendingCommitments = async (req, res, next) => {
  try {
    // Get pending and approved orders (not yet executed)
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const summary = {
      totalPending: 0,
      totalApproved: 0,
      pendingIncome: 0,
      pendingExpense: 0,
      approvedIncome: 0,
      approvedExpense: 0,
      totalCommitment: 0,
    };

    const commitments = pendingOrders.map((order) => {
      const amount = Number(order.amount);

      if (order.status === "PENDING") {
        summary.totalPending += amount;
        if (order.type === "INCOME") {
          summary.pendingIncome += amount;
        } else {
          summary.pendingExpense += amount;
        }
      } else if (order.status === "APPROVED") {
        summary.totalApproved += amount;
        if (order.type === "INCOME") {
          summary.approvedIncome += amount;
        } else {
          summary.approvedExpense += amount;
        }
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        amount: amount,
        status: order.status,
        description: order.description,
        createdBy: order.createdBy.fullName,
        createdAt: order.createdAt,
      };
    });

    summary.totalCommitment = summary.totalPending + summary.totalApproved;

    // Get current balance
    const lastMovement = await prisma.dailyMovement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const currentBalance = lastMovement ? lastMovement.balanceAfter : 0;

    // Calculate required liquidity
    const requiredLiquidity = summary.approvedExpense + summary.pendingExpense;
    const availableAfterCommitments =
      Number(currentBalance) - requiredLiquidity;

    res.status(200).json({
      success: true,
      data: {
        currentBalance: Number(currentBalance),
        requiredLiquidity,
        availableAfterCommitments,
        summary,
        commitments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Audit Log
 * @route   GET /api/reports/audit-log
 * @access  Private (Admin)
 * @description User actions and modifications
 */
exports.getAuditLog = async (req, res, next) => {
  try {
    const {
      userId,
      action,
      tableName,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (tableName) where.tableName = tableName;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get unique actions and tables for filters
    const [actions, tables] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
      }),
      prisma.auditLog.findMany({
        select: { tableName: true },
        distinct: ["tableName"],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      filters: {
        actions: actions.map((a) => a.action),
        tables: tables.map((t) => t.tableName),
      },
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
 * @desc    User Permissions Report
 * @route   GET /api/reports/user-permissions
 * @access  Private (Admin)
 * @description User roles and access rights
 */
exports.getUserPermissionsReport = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        _count: {
          select: {
            createdOrders: true,
            uploadedDocuments: true,
          },
        },
      },
      orderBy: {
        role: {
          name: "asc",
        },
      },
    });

    const summary = {
      totalUsers: users.length,
      byRole: {},
    };

    users.forEach((user) => {
      const roleName = user.role.name;
      if (!summary.byRole[roleName]) {
        summary.byRole[roleName] = 0;
      }
      summary.byRole[roleName]++;
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Client Transaction History
 * @route   GET /api/reports/client-transactions
 * @access  Private (Client - sees own data)
 * @description Personal transactions and receipts
 */
exports.getClientTransactionHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    const where = {};

    // If client, only show their orders
    if (req.user.role.name === "Client") {
      where.createdById = req.user.id;
    }

    if (type) where.type = type;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const summary = {
      totalTransactions: orders.length,
      totalIncome: 0,
      totalExpense: 0,
      netTotal: 0,
    };

    orders.forEach((order) => {
      const amount = Number(order.amount);
      if (order.type === "INCOME") {
        summary.totalIncome += amount;
      } else {
        summary.totalExpense += amount;
      }
    });

    summary.netTotal = summary.totalIncome - summary.totalExpense;

    res.status(200).json({
      success: true,
      data: {
        summary,
        transactions: orders.map((order) => ({
          ...order,
          amount: Number(order.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
