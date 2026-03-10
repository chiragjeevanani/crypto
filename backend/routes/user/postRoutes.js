const express = require("express");
const {
  createPost,
  getPosts,
  getPostById,
  toggleLike,
  getComments,
  createComment,
  sharePost
} = require("../../controllers/user/postController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");

const router = express.Router();

router.post("/", protect, authorize("User"), upload.single("media"), createPost);
router.get("/", protect, getPosts);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/share", protect, sharePost);
router.get("/:id/comments", protect, getComments);
router.post("/:id/comments", protect, createComment);
router.get("/:id", protect, getPostById);

module.exports = router;
