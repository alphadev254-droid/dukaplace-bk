const pool = require("./config/db");

const migrate = async () => {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME DEFAULT NULL
    `);
    console.log("✅ Password reset columns added successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  }
};

migrate();
