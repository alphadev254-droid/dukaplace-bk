const pool = require("./config/db");

const fixUserDates = async () => {
  try {
    const connection = await pool.getConnection();

    // Update NULL created_at values with current timestamp
    const [result] = await connection.query(`
      UPDATE users 
      SET created_at = CURRENT_TIMESTAMP 
      WHERE created_at IS NULL
    `);

    console.log(`✅ Fixed ${result.affectedRows} users with NULL created_at`);

    // Verify the fix
    const [users] = await connection.query(`
      SELECT id, name, email, is_verified, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log("\n📋 Current users:");
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Verified: ${user.is_verified ? 'Yes' : 'No'}`);
      console.log(`  Joined: ${user.created_at}`);
    });

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

fixUserDates();
