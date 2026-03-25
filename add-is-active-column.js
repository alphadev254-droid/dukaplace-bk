const pool = require("./config/db");

const addIsActiveColumn = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
    `);
    console.log("✅ Added is_active column to users table");
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

addIsActiveColumn();
