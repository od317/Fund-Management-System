// src/sockets/eventHandlers.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Handle order events and emit real-time updates
 */
class SocketEventHandler {
  constructor(socketUtils) {
    this.emitToUser = socketUtils.emitToUser;
    this.emitToRole = socketUtils.emitToRole;
    this.emitToAll = socketUtils.emitToAll;
    this.isUserOnline = socketUtils.isUserOnline;
  }

  /**
   * When a new order is created/submitted
   */
  async onOrderCreated(order) {
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
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

      // Notify Finance Managers about new pending order
      if (fullOrder.status === "PENDING") {
        this.emitToRole("Finance Manager", "order:new", {
          type: "NEW_ORDER",
          order: fullOrder,
          message: `New order ${fullOrder.orderNumber} requires approval`,
        });

        // Also notify admins
        this.emitToRole("Admin", "order:new", {
          type: "NEW_ORDER",
          order: fullOrder,
          message: `New order ${fullOrder.orderNumber} submitted`,
        });

        // Create notification for Finance Managers
        await this.createNotificationForRole(
          "Finance Manager",
          "New Order Submitted",
          `Order ${fullOrder.orderNumber} (${fullOrder.type}) by ${fullOrder.createdBy.fullName} requires your approval`,
          "ORDER_SUBMITTED",
          fullOrder.id,
          `/orders/${fullOrder.id}`,
        );
      }
    } catch (error) {
      console.error("Error in onOrderCreated:", error);
    }
  }

  /**
   * When an order is approved
   */
  async onOrderApproved(order) {
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
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

      // Notify the order creator
      this.emitToUser(fullOrder.createdById, "order:approved", {
        type: "ORDER_APPROVED",
        order: fullOrder,
        message: `Your order ${fullOrder.orderNumber} has been approved by ${fullOrder.approvedBy.fullName}`,
      });

      // Create notification for order creator
      await this.createNotification(
        fullOrder.createdById,
        "Order Approved",
        `Your order ${fullOrder.orderNumber} has been approved`,
        "ORDER_APPROVED",
        fullOrder.id,
        `/orders/${fullOrder.id}`,
      );

      // Update dashboard for all relevant users
      this.emitToRole("Admin", "dashboard:update", {
        type: "ORDER_APPROVED",
        orderId: fullOrder.id,
      });
    } catch (error) {
      console.error("Error in onOrderApproved:", error);
    }
  }

  /**
   * When an order is rejected
   */
  async onOrderRejected(order) {
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
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

      // Notify the order creator
      this.emitToUser(fullOrder.createdById, "order:rejected", {
        type: "ORDER_REJECTED",
        order: fullOrder,
        message: `Your order ${fullOrder.orderNumber} has been rejected. Reason: ${fullOrder.notes || "No reason provided"}`,
      });

      // Create notification
      await this.createNotification(
        fullOrder.createdById,
        "Order Rejected",
        `Your order ${fullOrder.orderNumber} has been rejected`,
        "ORDER_REJECTED",
        fullOrder.id,
        `/orders/${fullOrder.id}`,
      );

      // Update dashboard
      this.emitToRole("Admin", "dashboard:update", {
        type: "ORDER_REJECTED",
        orderId: fullOrder.id,
      });
    } catch (error) {
      console.error("Error in onOrderRejected:", error);
    }
  }

  /**
   * When an order is executed
   */
  async onOrderExecuted(order) {
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
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

      // Notify the order creator
      this.emitToUser(fullOrder.createdById, "order:executed", {
        type: "ORDER_EXECUTED",
        order: fullOrder,
        message: `Your order ${fullOrder.orderNumber} has been executed`,
      });

      // Create notification
      await this.createNotification(
        fullOrder.createdById,
        "Order Executed",
        `Your order ${fullOrder.orderNumber} (${fullOrder.type}: $${fullOrder.amount}) has been executed`,
        "ORDER_EXECUTED",
        fullOrder.id,
        `/orders/${fullOrder.id}`,
      );

      // Update dashboards for all relevant users
      this.emitToRole("Admin", "dashboard:update", {
        type: "ORDER_EXECUTED",
        orderId: fullOrder.id,
      });

      this.emitToRole("Investor", "dashboard:update", {
        type: "ORDER_EXECUTED",
        orderId: fullOrder.id,
      });

      this.emitToRole("Finance Manager", "dashboard:update", {
        type: "ORDER_EXECUTED",
        orderId: fullOrder.id,
      });
    } catch (error) {
      console.error("Error in onOrderExecuted:", error);
    }
  }

  /**
   * Create notification for a specific user
   */
  async createNotification(userId, title, message, type, orderId, link) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          orderId,
          link,
        },
      });

      // Send real-time notification to user if online
      this.emitToUser(userId, "notification:new", {
        type: "NEW_NOTIFICATION",
        notification,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  /**
   * Create notification for all users with a specific role
   */
  async createNotificationForRole(
    roleName,
    title,
    message,
    type,
    orderId,
    link,
  ) {
    try {
      // Get all users with this role
      const users = await prisma.user.findMany({
        where: {
          role: { name: roleName },
          isActive: true,
        },
      });

      // Create notification for each user
      for (const user of users) {
        await this.createNotification(
          user.id,
          title,
          message,
          type,
          orderId,
          link,
        );
      }
    } catch (error) {
      console.error("Error creating role notification:", error);
    }
  }
}

module.exports = SocketEventHandler;
