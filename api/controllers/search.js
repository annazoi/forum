const User = require("../model/User");
const Post = require("../model/Post");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildVisibilityFilter = async (loggedInUserId) => {
  let followedUserIds = [];
  if (loggedInUserId) {
    const user = await User.findById(loggedInUserId);
    if (user) {
      followedUserIds = user.following || [];
    }
  }
  return {
    $or: [
      { visibility: "public" },
      { visibility: { $exists: false } },
      { creatorId: loggedInUserId },
      {
        visibility: "private",
        creatorId: { $in: followedUserIds },
      },
    ],
  };
};

const search = async (req, res) => {
  try {
    const raw = (req.query.q || "").trim();
    const type = req.query.type || "all";
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);

    if (!raw || raw.length < 2) {
      return res.status(200).json({ message: "ok", users: [], posts: [] });
    }

    const loggedInUserId = req.userId;
    const visibilityFilter = await buildVisibilityFilter(loggedInUserId);

    const isHashtag = raw.startsWith("#");
    const tag = isHashtag ? raw.slice(1) : raw;
    const escaped = escapeRegex(tag);
    const textPattern = isHashtag
      ? new RegExp(`#${escaped}\\b|#${escaped}(?![\\w])`, "i")
      : new RegExp(escaped, "i");

    const userPattern = new RegExp(escaped, "i");

    let users = [];
    let posts = [];

    if (type === "all" || type === "users") {
      users = await User.find({
        $or: [
          { username: userPattern },
          { name: userPattern },
          { surname: userPattern },
        ],
      })
        .select("-password")
        .limit(limit)
        .lean();
    }

    if (type === "all" || type === "posts") {
      posts = await Post.find({
        $and: [{ description: textPattern }, visibilityFilter],
      })
        .sort({ date: -1 })
        .limit(limit)
        .populate("creatorId", "-password");
    }

    res.status(200).json({ message: "ok", users, posts });
  } catch (err) {
    res.status(500).json({ message: "Search failed", users: [], posts: [] });
  }
};

exports.search = search;
