require("dotenv").config();
const prisma = require("./lib/prisma");
const { hashPassword } = require("./utils");

const createAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@dukaplace.com";
    const pass  = process.env.ADMIN_PASS  || "admin123";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${email}`);
      return;
    }

    await prisma.user.create({
      data: {
        name:       "Admin",
        email,
        password:   await hashPassword(pass),
        role:       "admin",
        isVerified: true,
        isActive:   true,
      },
    });

    console.log(`✅ Admin created: ${email} / ${pass}`);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();
