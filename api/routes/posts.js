const express = require("express");
const router = express.Router();
const middleWare = require("../middlewares/authMiddleware");
const uploadVideo = require("../middlewares/uploadVideo");
const postController = require("../controllers/posts");
const commentController = require("../controllers/comments");

router.post(
  "/reels",
  middleWare.protect,
  (req, res, next) => {
    uploadVideo.single("video")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ message: "Video must be under 100MB" });
        }
        return res.status(400).json({ message: err.message || "Invalid video file" });
      }
      next();
    });
  },
  postController.createReel
);
router.post("/", middleWare.protect, postController.createPost);
router.delete("/:id", middleWare.protect, postController.deletePost);
router.get("/", middleWare.extractUser, postController.getPosts);
router.get("/reels", middleWare.extractUser, postController.getReels);
router.get("/:id", middleWare.extractUser, postController.getPost);
router.post("/:id/like", middleWare.protect, postController.likePost);
router.post("/:id/unlike", middleWare.protect, postController.unlikePost);

// comments
router.post(
  "/:id/comments",
  middleWare.protect,
  commentController.createComment
);
router.delete(
  "/:id/comments/:commentId",
  middleWare.protect,
  commentController.deleteComment
);

// router.get("/:id/comments", commentController.getComments);
// router.get("/:id/comments/:commentId", commentController.getComment);

module.exports = router;
