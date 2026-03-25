const pool = require("./config/db");

const migrateProductStatus = async () => {
  try {
    const connection = await pool.getConnection();

    console.log("Starting product status migration...");

    // Update existing statuses
    await connection.query("UPDATE products SET status = 'inactive' WHERE status IN ('pending', 'rejected', 'draft')");
    
    // Alter the enum
    await connection.query(`
      ALTER TABLE products 
      MODIFY COLUMN status ENUM('active', 'inactive', 'sold') DEFAULT 'active'
    `);

    connection.release();
    console.log("✅ Product status migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  }
};

migrateProductStatus();
