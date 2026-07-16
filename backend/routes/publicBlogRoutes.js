const express = require("express");
const router = express.Router();
const { apiLimiter } = require("../middleware/rateLimiter");
const {
  listPublicBlogs,
  getPublicBlogBySlug,
  getTrendingBlogs,
  getRandomBlogs,
  getBlogsByCategory,
  getBlogsByAuthor,
} = require("../controllers/publicBlogController");

// Secure all public endpoints under the rate limiter to prevent crawling/DDoS abuse
router.use(apiLimiter);

// Expose endpoints
router.get("/", listPublicBlogs);
router.get("/trending", getTrendingBlogs);
router.get("/random", getRandomBlogs);
router.get("/slug/:slug", getPublicBlogBySlug);
router.get("/category/:categorySlug", getBlogsByCategory);
router.get("/author/:authorId", getBlogsByAuthor);

module.exports = router;
