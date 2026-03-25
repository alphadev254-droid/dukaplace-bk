const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const path         = require("path");
require("dotenv").config();

const prisma             = require("./lib/prisma");
const { startEmailWorker } = require("./utils/emailWorker");
const { apiLimiter }     = require("./middleware/rateLimiter");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.APP_URL || "http://localhost:8080", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiLimiter);

app.get("/", (_req, res) => res.json({ success: true, message: "Dukaplace API is running 🚀" }));

app.use("/api/auth",       require("./routes/auth"));
app.use("/api/users",      require("./routes/users"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/products",   require("./routes/products"));
app.use("/api/wishlist",   require("./routes/wishlist"));
app.use("/api/messages",   require("./routes/messages"));
app.use("/api/orders",     require("./routes/orders"));
app.use("/api/admin",      require("./routes/admin"));

prisma.$connect()
  .then(() => {
    console.log("✅ Prisma connected to database");
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      startEmailWorker();
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  });
