const pool = require("./config/db");

const updateProductStatusEnum = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Alter the products table to update the status ENUM
    await connection.query(`
      ALTER TABLE products 
      MODIFY COLUMN status ENUM('active', 'inactive', 'sold', 'rejected') DEFAULT 'active'
    `);
    
    connection.release();
    console.log("✅ Product status ENUM updated successfully! Now includes: active, inactive, sold, rejected");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating product status ENUM:", error.message);
    process.exit(1);
  }
};

updateProductStatusEnum();
