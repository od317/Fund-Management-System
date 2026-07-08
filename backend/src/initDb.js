// src/initDb.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log("🚀 Starting database initialization...\n");

    // 1. Create default roles
    console.log("📝 Creating roles...");

    const roles = [
      {
        name: "Admin",
        description: "System administrator with full access",
        permissions: {
          all: true,
          manage_users: true,
          manage_roles: true,
          manage_categories: true,
          create_orders: true,
          edit_orders: true,
          delete_orders: true,
          approve_orders: true,
          reject_orders: true,
          execute_orders: true,
          view_all_orders: true,
          view_own_orders: true,
          upload_documents: true,
          view_documents: true,
          generate_reports: true,
          export_reports: true,
          view_audit_logs: true,
          system_settings: true,
          receive_notifications: true,
        },
      },
      {
        name: "Investor",
        description:
          "Financial investor with view-only access to financial data",
        permissions: {
          view_all_orders: true,
          view_own_orders: true,
          view_documents: true,
          generate_reports: true,
          export_reports: true,
          receive_notifications: true,
        },
      },
      {
        name: "Finance Manager",
        description: "Financial manager with approval authority",
        permissions: {
          create_orders: true,
          edit_orders: true,
          approve_orders: true,
          reject_orders: true,
          execute_orders: true,
          view_all_orders: true,
          view_own_orders: true,
          upload_documents: true,
          view_documents: true,
          generate_reports: true,
          export_reports: true,
          receive_notifications: true,
        },
      },
      {
        name: "Employee",
        description: "Regular employee who can create orders",
        permissions: {
          create_orders: true,
          edit_orders: true,
          view_own_orders: true,
          upload_documents: true,
          view_documents: true,
          receive_notifications: true,
        },
      },
      {
        name: "Client",
        description: "External client with limited access",
        permissions: {
          view_own_orders: true,
          view_documents: true,
          receive_notifications: true,
        },
      },
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: role,
      });
    }
    console.log("✅ Roles created");

    // 2. Create default admin user
    console.log("\n👤 Creating admin user...");

    const adminRole = await prisma.role.findUnique({
      where: { name: "Admin" },
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const adminUser = await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        email: "admin@cashsystem.com",
        passwordHash: hashedPassword,
        fullName: "System Administrator",
        phone: "1234567890",
        roleId: adminRole.id,
        isActive: true,
      },
    });
    console.log("✅ Admin user created");

    // 3. Create finance manager
    console.log("\n👤 Creating finance manager...");

    const fmRole = await prisma.role.findUnique({
      where: { name: "Finance Manager" },
    });

    const fmPassword = await bcrypt.hash("finance123", salt);

    await prisma.user.upsert({
      where: { username: "finance" },
      update: {},
      create: {
        username: "finance",
        email: "finance@cashsystem.com",
        passwordHash: fmPassword,
        fullName: "Finance Manager",
        phone: "1234567891",
        roleId: fmRole.id,
        isActive: true,
      },
    });
    console.log("✅ Finance Manager created");

    // 4. Create employee
    console.log("\n👤 Creating employee...");

    const empRole = await prisma.role.findUnique({
      where: { name: "Employee" },
    });

    const empPassword = await bcrypt.hash("employee123", salt);

    await prisma.user.upsert({
      where: { username: "employee" },
      update: {},
      create: {
        username: "employee",
        email: "employee@cashsystem.com",
        passwordHash: empPassword,
        fullName: "Test Employee",
        phone: "1234567892",
        roleId: empRole.id,
        isActive: true,
      },
    });
    console.log("✅ Employee created");

    // 5. Create client
    console.log("\n👤 Creating client...");

    const clientRole = await prisma.role.findUnique({
      where: { name: "Client" },
    });

    const clientPassword = await bcrypt.hash("client123", salt);

    await prisma.user.upsert({
      where: { username: "client" },
      update: {},
      create: {
        username: "client",
        email: "client@example.com",
        passwordHash: clientPassword,
        fullName: "Test Client",
        phone: "1234567893",
        roleId: clientRole.id,
        isActive: true,
      },
    });
    console.log("✅ Client created");

    // 6. Create default categories
    console.log("\n📂 Creating categories...");

    const categories = [
      // Income categories
      {
        name: "Room Revenue",
        type: "INCOME",
        description: "Revenue from room bookings",
      },
      {
        name: "Restaurant Revenue",
        type: "INCOME",
        description: "Revenue from restaurant services",
      },
      {
        name: "Event Revenue",
        type: "INCOME",
        description: "Revenue from events and conferences",
      },
      {
        name: "Other Income",
        type: "INCOME",
        description: "Miscellaneous income",
      },

      // Expense categories
      {
        name: "Salaries & Wages",
        type: "EXPENSE",
        description: "Employee salaries and wages",
      },
      {
        name: "Utilities",
        type: "EXPENSE",
        description: "Electricity, water, gas, internet",
      },
      {
        name: "Maintenance",
        type: "EXPENSE",
        description: "Building and equipment maintenance",
      },
      {
        name: "Supplies",
        type: "EXPENSE",
        description: "Office and cleaning supplies",
      },
      {
        name: "Marketing",
        type: "EXPENSE",
        description: "Marketing and advertising expenses",
      },
      {
        name: "Other Expenses",
        type: "EXPENSE",
        description: "Miscellaneous expenses",
      },
    ];

    // Check if categories already exist
    const existingCategories = await prisma.category.count();

    if (existingCategories === 0) {
      for (const category of categories) {
        await prisma.category.create({
          data: category,
        });
      }
      console.log("✅ Categories created");
    } else {
      console.log("⚠️  Categories already exist, skipping...");
    }

    // 7. Create company settings
    console.log("\n🏢 Creating company settings...");

    const existingSettings = await prisma.companySettings.count();

    if (existingSettings === 0) {
      await prisma.companySettings.create({
        data: {
          companyName: "Grand Hotel Management",
          address: "123 Main Street, City",
          phone: "+1234567890",
          email: "info@grandhotel.com",
          website: "www.grandhotel.com",
          currency: "USD",
          timezone: "America/New_York",
          dateFormat: "YYYY-MM-DD",
          taxId: "TAX-123456",
        },
      });
      console.log("✅ Company settings created");
    } else {
      console.log("⚠️  Company settings already exist, skipping...");
    }

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📋 Test Users:");
    console.log("┌─────────────────┬────────────┬───────────────┐");
    console.log("│ Role            │ Username   │ Password      │");
    console.log("├─────────────────┼────────────┼───────────────┤");
    console.log("│ Admin           │ admin      │ admin123      │");
    console.log("│ Finance Manager │ finance    │ finance123    │");
    console.log("│ Employee        │ employee   │ employee123   │");
    console.log("│ Client          │ client     │ client123     │");
    console.log("└─────────────────┴────────────┴───────────────┘");
    console.log("\n🚀 Next steps:");
    console.log("   1. Start server: npm run dev");
    console.log("   2. Test login: POST http://localhost:5000/api/auth/login");
    console.log("   3. Use admin/admin123 to login");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Initialization failed:", error);
    process.exit(1);
  });
