const express = require("express");
const {
  createPost,
  getPosts,
  getPostById,
  getMyNFTs,
  toggleLike,
  getComments,
  createComment,
  sharePost,
  recordView,
  reportPost,
  deletePost
} = require("../../controllers/user/postController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { upload } = require("../../utils/upload");

const router = express.Router();

router.post("/", protect, authorize("User", "SuperNode", "Admin", "super_admin", "Developer"), upload.single("media"), createPost);
router.get("/my-nfts", protect, getMyNFTs);
router.get("/my-collection", protect, require("../../controllers/user/postController").getMyCollection);
router.get("/", protect, getPosts);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/share", protect, sharePost);
router.get("/:id/comments", protect, getComments);
router.post("/:id/comments", protect, createComment);
router.post("/:id/view", protect, recordView);
router.post("/:id/report", protect, reportPost);
router.delete("/:id", protect, deletePost);
router.get("/:id", protect, getPostById);

module.exports = router;
