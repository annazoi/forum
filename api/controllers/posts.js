const Post = require("../model/Post");
const User = require("../model/User");
const Notification = require("../model/Notification");
const cloudinary = require("../utils/cloudinary");

const createPost = async (req, res) => {
  const { description, image, video, type } = req.body;
  try {
    let imageUrl = "";
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "posts",
      });
      imageUrl = result.url;
    }

    let videoUrl = "";
    if (video) {
      const result = await cloudinary.uploader.upload(video, {
        folder: "reels",
        resource_type: "video",
      });
      videoUrl = result.url;
    }

    const post = await Post.create({
      description,
      image: imageUrl,
      video: videoUrl,
      type: type || (videoUrl ? "reel" : "post"),
      creatorId: req.userId,
      visibility: req.body.visibility || 'public',
    });

    res.status(201).json({
      message: "OK",
      post: post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not create post. Please try later",
      post: null,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const removedPost = await Post.deleteOne({
      _id: req.params.id,
      creatorId: req.userId,
    });
    res.json(removedPost);
  } catch (err) {
    res.status(404).send({ message: "post not found" });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      creatorId: req.userId,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found", post: null });
    }

    if (req.body.description !== undefined) {
      post.description = req.body.description;
    }
    if (req.body.visibility !== undefined) {
      post.visibility = req.body.visibility;
    }

    await post.save();

    res.status(200).json({ message: "OK", post });
  } catch (err) {
    res.status(500).json({ message: "Could not update post", post: null });
  }
};

const buildVisibilityFilter = (loggedInUserId, followedUserIds) => ({
  $or: [
    { visibility: "public" },
    { visibility: { $exists: false } },
    { creatorId: loggedInUserId },
    {
      visibility: "private",
      creatorId: { $in: followedUserIds },
    },
  ],
});

const getPosts = async (req, res) => {
  try {
    const loggedInUserId = req.userId;
    let followedUserIds = [];

    if (loggedInUserId) {
      const user = await User.findById(loggedInUserId);
      if (user) {
        followedUserIds = user.following || [];
      }
    }

    const visibilityFilter = buildVisibilityFilter(
      loggedInUserId,
      followedUserIds
    );

    let filter = {
      $and: [
        visibilityFilter,
        { $or: [{ type: { $exists: false } }, { type: "post" }] },
      ],
    };
    const creatorId = req.query.creatorId;
    if (creatorId) {
      filter = {
        $and: [
          { creatorId: creatorId },
          visibilityFilter,
          { $or: [{ type: { $exists: false } }, { type: "post" }] },
        ],
      };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creatorId comments.creatorId", "-password");

    if (!posts || posts.length === 0) {
      return res.status(200).json({ message: "No more posts", posts: [] });
    }
    res.status(200).json({ message: "ok", posts: posts });
  } catch (err) {
    res.status(500).json({ message: "Server error", posts: null });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "creatorId comments.creatorId",
      "-password"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not Found", post: null });
    }

    // Check visibility for private posts
    if (post.visibility === "private") {
      const isCreator = String(post.creatorId._id) === req.userId;
      const isFollower =
        req.userId &&
        post.creatorId.followers?.some((id) => String(id) === req.userId);

      if (!isCreator && !isFollower) {
        return res
          .status(403)
          .json({ message: "This post is private", post: null });
      }
    }

    res.status(201).json({ message: "ok", post: post });
  } catch (err) {
    return res.status(404).json({ message: "Post not Found", post: null });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.userId)) {
      await post.updateOne({ $push: { likes: req.userId } });

      if (String(post.creatorId) !== req.userId) {
        await Notification.create({
          recipient: post.creatorId,
          sender: req.userId,
          type: "like",
          post: post._id,
        });
      }

      res.status(200).json({ message: "Post liked" });
    } else {
      res.status(400).json({ message: "Post already liked" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(req.userId)) {
      await post.updateOne({ $pull: { likes: req.userId } });
      res.status(200).json({ message: "Post unliked" });
    } else {
      res.status(400).json({ message: "Post not liked yet" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const uploadVideoToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "reels", resource_type: "video" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

const createReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required", post: null });
    }

    const videoUrl = await uploadVideoToCloudinary(req.file.buffer);

    const post = await Post.create({
      description: req.body.description || "",
      video: videoUrl,
      type: "reel",
      creatorId: req.userId,
      visibility: req.body.visibility || "public",
    });

    res.status(201).json({ message: "OK", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not upload video. Try a shorter clip or smaller file.",
      post: null,
    });
  }
};

const getReels = async (req, res) => {
  try {
    const loggedInUserId = req.userId;
    let followedUserIds = [];

    if (loggedInUserId) {
      const user = await User.findById(loggedInUserId);
      if (user) {
        followedUserIds = user.following || [];
      }
    }

    const visibilityFilter = buildVisibilityFilter(
      loggedInUserId,
      followedUserIds
    );

    let filter = {
      $and: [visibilityFilter, { type: "reel" }],
    };

    const creatorId = req.query.creatorId;
    if (creatorId) {
      filter = {
        $and: [{ creatorId: creatorId }, visibilityFilter, { type: "reel" }],
      };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = await Post.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creatorId comments.creatorId", "-password");

    if (!reels || reels.length === 0) {
      return res.status(200).json({ message: "No more reels", reels: [] });
    }

    res.status(200).json({ message: "ok", reels });
  } catch (err) {
    res.status(500).json({ message: "Server error", reels: null });
  }
};

exports.createPost = createPost;
exports.createReel = createReel;
exports.updatePost = updatePost;
exports.getReels = getReels;
exports.deletePost = deletePost;
exports.getPosts = getPosts;
exports.getPost = getPost;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
