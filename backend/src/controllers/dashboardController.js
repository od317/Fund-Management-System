// src/controllers/dashboardController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc    Admin Dashboard
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // KPI Cards
    const [
      pendingOrdersCount,
      todayTransactions,
      activeUsersCount,
      totalIncome,
      totalExpense,
    ] = await Promise.all([
      // Pending orders count
      prisma.order.count({
        where: { status: "PENDING" },
      }),

      // Today's transactions
      prisma.order.findMany({
        where: {
          executedAt: {
            gte: today,
            lt: tomorrow,
          },
          status: "EXECUTED",
        },
        select: {
          id: true,
          orderNumber: true,
          type: true,
          amount: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Active users count
      prisma.user.count({
        where: {
          isActive: true,
          lastLogin: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),

      // Total income (all time)
      prisma.order.aggregate({
        where: {
          type: "INCOME",
          status: "EXECUTED",
        },
        _sum: { amount: true },
      }),

      // Total expense (all time)
      prisma.order.aggregate({
        where: {
          type: "EXPENSE",
          status: "EXECUTED",
        },
        _sum: { amount: true },
      }),
    ]);

    // Current balance
    const lastMovement = await prisma.dailyMovement.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const currentBalance = lastMovement ? lastMovement.balanceAfter : 0;

    // Today's cash flow
    const todayIncome = todayTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const todayExpense = todayTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Daily cash flow for last 7 days (for chart)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyMovements = await prisma.dailyMovement.findMany({
      where: {
        transactionDate: {
          gte: sevenDaysAgo,
          lt: tomorrow,
        },
      },
      orderBy: { transactionDate: "asc" },
    });

    // Format daily chart data
    const cashFlowChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayMovements = dailyMovements.filter(
        (m) =>
          new Date(m.transactionDate).toISOString().split("T")[0] === dateStr,
      );

      const dayIncome = dayMovements
        .filter((m) => m.type === "INCOME")
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const dayExpense = dayMovements
        .filter((m) => m.type === "EXPENSE")
        .reduce((sum, m) => sum + Number(m.amount), 0);

      cashFlowChart.push({
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
      });
    }

    // Recent activity
    const recentOrders = await prisma.order.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Order status distribution
    const orderStatusDistribution = await Promise.all([
      prisma.order.count({ where: { status: "DRAFT" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "APPROVED" } }),
      prisma.order.count({ where: { status: "REJECTED" } }),
      prisma.order.count({ where: { status: "EXECUTED" } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          pendingOrders: pendingOrdersCount,
          todayTransactions: todayTransactions.length,
          todayIncome: parseFloat(todayIncome.toFixed(2)),
          todayExpense: parseFloat(todayExpense.toFixed(2)),
          activeUsers: activeUsersCount,
          currentBalance: Number(currentBalance),
          totalIncome: totalIncome._sum.amount
            ? Number(totalIncome._sum.amount)
            : 0,
          totalExpense: totalExpense._sum.amount
            ? Number(totalExpense._sum.amount)
            : 0,
        },
        charts: {
          cashFlow: cashFlowChart,
          orderStatus: {
            draft: orderStatusDistribution[0],
            pending: orderStatusDistribution[1],
            approved: orderStatusDistribution[2],
            rejected: orderStatusDistribution[3],
            executed: orderStatusDistribution[4],
          },
        },
        recentActivity: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          type: order.type,
          amount: Number(order.amount),
          status: order.status,
          description: order.description,
          createdBy: order.createdBy.fullName,
          createdAt: order.createdAt,
        })),
        todayTransactions: todayTransactions.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Investor Dashboard
 * @route   GET /api/dashboard/investor
 * @access  Private (Investor, Admin)
 */
exports.getInvestorDashboard = async (req, res, next) => {
  try {
    // Get current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Financial KPIs
    const [
      monthlyIncome,
      monthlyExpense,
      totalIncome,
      totalExpense,
      lastMovement,
    ] = await Promise.all([
      // Monthly income
      prisma.order.aggregate({
        where: {
          type: "INCOME",
          status: "EXECUTED",
          executedAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        _sum: { amount: true },
      }),

      // Monthly expense
      prisma.order.aggregate({
        where: {
          type: "EXPENSE",
          status: "EXECUTED",
          executedAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        _sum: { amount: true },
      }),

      // Total income (all time)
      prisma.order.aggregate({
        where: { type: "INCOME", status: "EXECUTED" },
        _sum: { amount: true },
      }),

      // Total expense (all time)
      prisma.order.aggregate({
        where: { type: "EXPENSE", status: "EXECUTED" },
        _sum: { amount: true },
      }),

      // Current balance
      prisma.dailyMovement.findFirst({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const currentBalance = lastMovement ? lastMovement.balanceAfter : 0;

    // Monthly income vs expense chart (last 6 months)
    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [monthIncome, monthExpense] = await Promise.all([
        prisma.order.aggregate({
          where: {
            type: "INCOME",
            status: "EXECUTED",
            executedAt: {
              gte: date,
              lte: monthEnd,
            },
          },
          _sum: { amount: true },
        }),
        prisma.order.aggregate({
          where: {
            type: "EXPENSE",
            status: "EXECUTED",
            executedAt: {
              gte: date,
              lte: monthEnd,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      monthlyChart.push({
        month: date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }),
        income: monthIncome._sum.amount ? Number(monthIncome._sum.amount) : 0,
        expense: monthExpense._sum.amount
          ? Number(monthExpense._sum.amount)
          : 0,
        net:
          (monthIncome._sum.amount ? Number(monthIncome._sum.amount) : 0) -
          (monthExpense._sum.amount ? Number(monthExpense._sum.amount) : 0),
      });
    }

    // Expense breakdown by category (current month)
    const expenseOrders = await prisma.order.findMany({
      where: {
        type: "EXPENSE",
        status: "EXECUTED",
        executedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    const expenseBreakdown = {};
    expenseOrders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryName = item.category.name;
        if (!expenseBreakdown[categoryName]) {
          expenseBreakdown[categoryName] = {
            category: categoryName,
            amount: 0,
          };
        }
        expenseBreakdown[categoryName].amount += Number(item.amount);
      });
    });

    // Pending commitments
    const pendingCommitments = await prisma.order.aggregate({
      where: {
        status: { in: ["PENDING", "APPROVED"] },
        type: "EXPENSE",
      },
      _sum: { amount: true },
    });

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          monthlyIncome: monthlyIncome._sum.amount
            ? Number(monthlyIncome._sum.amount)
            : 0,
          monthlyExpense: monthlyExpense._sum.amount
            ? Number(monthlyExpense._sum.amount)
            : 0,
          monthlyNet:
            (monthlyIncome._sum.amount
              ? Number(monthlyIncome._sum.amount)
              : 0) -
            (monthlyExpense._sum.amount
              ? Number(monthlyExpense._sum.amount)
              : 0),
          totalIncome: totalIncome._sum.amount
            ? Number(totalIncome._sum.amount)
            : 0,
          totalExpense: totalExpense._sum.amount
            ? Number(totalExpense._sum.amount)
            : 0,
          currentBalance: Number(currentBalance),
          pendingCommitments: pendingCommitments._sum.amount
            ? Number(pendingCommitments._sum.amount)
            : 0,
        },
        charts: {
          monthlyCashFlow: monthlyChart,
          expenseBreakdown: Object.values(expenseBreakdown),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Finance Manager Dashboard
 * @route   GET /api/dashboard/finance-manager
 * @access  Private (Finance Manager, Admin)
 */
exports.getFinanceManagerDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Pending approvals
    const pendingApprovals = await prisma.order.findMany({
      where: { status: "PENDING" },
      include: {
        createdBy: {
          select: {
            id: true,
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
      orderBy: { createdAt: "asc" },
    });

    // Today's stats
    const [
      todayApproved,
      todayExecuted,
      lastMovement,
      pendingCount,
      approvedCount,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          status: "APPROVED",
          approvedAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.order.count({
        where: {
          status: "EXECUTED",
          executedAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.dailyMovement.findFirst({
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "APPROVED" } }),
    ]);

    const currentBalance = lastMovement ? lastMovement.balanceAfter : 0;

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          pendingApprovals: pendingCount,
          approvedAwaitingExecution: approvedCount,
          todayApproved,
          todayExecuted,
          currentBalance: Number(currentBalance),
        },
        pendingApprovalList: pendingApprovals.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          type: order.type,
          amount: Number(order.amount),
          description: order.description,
          createdBy: order.createdBy.fullName,
          itemCount: order._count.items,
          documentCount: order._count.documents,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Employee Dashboard
 * @route   GET /api/dashboard/employee
 * @access  Private (Employee)
 */
exports.getEmployeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // My orders stats
    const [myPendingOrders, myExecutedOrders, myDraftOrders, myRecentOrders] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            createdById: userId,
            status: { in: ["PENDING", "APPROVED"] },
          },
          include: {
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({
          where: {
            createdById: userId,
            status: "EXECUTED",
          },
        }),
        prisma.order.count({
          where: {
            createdById: userId,
            status: "DRAFT",
          },
        }),
        prisma.order.findMany({
          where: { createdById: userId },
          include: {
            _count: { select: { items: true, documents: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          pendingOrders: myPendingOrders.length,
          executedOrders: myExecutedOrders,
          draftOrders: myDraftOrders,
          totalOrders:
            myPendingOrders.length + myExecutedOrders + myDraftOrders,
        },
        pendingOrders: myPendingOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          type: order.type,
          amount: Number(order.amount),
          status: order.status,
          description: order.description,
          itemCount: order._count.items,
          createdAt: order.createdAt,
        })),
        recentOrders: myRecentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          type: order.type,
          amount: Number(order.amount),
          status: order.status,
          description: order.description,
          itemCount: order._count.items,
          documentCount: order._count.documents,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Client Dashboard
 * @route   GET /api/dashboard/client
 * @access  Private (Client)
 */
exports.getClientDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Client transactions
    const [recentTransactions, transactionStats] = await Promise.all([
      prisma.order.findMany({
        where: { createdById: userId },
        include: {
          documents: {
            select: {
              id: true,
              fileName: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ["type"],
        where: {
          createdById: userId,
          status: "EXECUTED",
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    transactionStats.forEach((stat) => {
      if (stat.type === "INCOME") {
        totalIncome = stat._sum.amount ? Number(stat._sum.amount) : 0;
        incomeCount = stat._count;
      } else {
        totalExpense = stat._sum.amount ? Number(stat._sum.amount) : 0;
        expenseCount = stat._count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalTransactions: incomeCount + expenseCount,
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
        },
        recentTransactions: recentTransactions.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          type: order.type,
          amount: Number(order.amount),
          status: order.status,
          description: order.description,
          documents: order.documents,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
