require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

const connectDB = require("./config/db");
const galleryRoutes = require("./routes/galleryRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const blogRoutes = require("./routes/blogRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const pageRoutes = require("./routes/pageRoutes");
const pageCategoryRoutes = require("./routes/pageCategoryRoutes");
const migrateRoutes = require("./routes/migrateRoutes");
const backupRoutes = require("./routes/backupRoutes");
const publicBlogRoutes = require("./routes/publicBlogRoutes");
const publicContactRoutes = require("./routes/publicContactRoutes");
const publicSettingRoutes = require("./routes/publicSettingRoutes");
const settingRoutes = require("./routes/settingRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

connectDB();
 
app.set("trust proxy", true);  
 
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, 
  })
);
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(mongoSanitize()); 
app.use("/api", apiLimiter);

const uploadStaticDir = process.env.UPLOAD_PATH 
  ? path.resolve(process.env.UPLOAD_PATH) 
  : path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadStaticDir));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/page-categories", pageCategoryRoutes);
app.use("/api/migrate", migrateRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/public/blogs", publicBlogRoutes);
app.use("/api/public", publicContactRoutes);
app.use("/api/public", publicSettingRoutes);
app.use("/api/settings", settingRoutes);

// Temporary manual seed route for free Render tier
const { runSeed } = require("./scripts/seed");
app.get("/api/seed-database-init", async (req, res) => {
  try {
    const msg = await runSeed();
    res.send(`<h1>${msg}</h1><p>You can now log into the admin panel using your SEED_ADMIN_EMAIL.</p>`);
  } catch (err) {
    res.status(500).send(`<h1>Seed Failed</h1><p>${err.message}</p>`);
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok", pid: process.pid, uptime: process.uptime() }));
 
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));
 
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File is too large" });
  }
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Something went wrong on our end" : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Dynamics Square API running on port ${PORT}`));
