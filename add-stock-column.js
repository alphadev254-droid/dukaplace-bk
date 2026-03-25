const pool = require("./config/db");

const addStockColumn = async () => {
  try {
    await pool.query("ALTER TABLE products ADD COLUMN stock INT DEFAULT 1 AFTER price");
    console.log("✅ Stock column added successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

addStockColumn();
