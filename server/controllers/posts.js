const Post = require("../model/Post");
const cloudinary = require("../utils/cloudinary");

const createPost = async (req, res) => {
  // const post = new Post({
  //   title: req.body.title,
  //   description: req.body.description,
  //   creatorId: req.userId,
  // });
  const { title, description, image } = req.body;
  console.log(req.body);
  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: "posts",
      // width: 300,
      // crop: "scale",
    });
    console.log(result.url);
    const post = await Post.create({
      title,
      description,
      creatorId: req.userId,
      image: result.url,
    });

    res.status(201).json({
      success: true,
      post,
    });

    // const savedPost = await post.save();
    // res.json(savedPost);
  } catch (error) {
    res.json({ message: error });
  }
};

const deletePost = async (req, res) => {
  try {
    const removedPost = await Post.deleteOne({ _id: req.params.id });

    res.json(removedPost);
  } catch (err) {
    res.json({ message: err });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "creatorId comments.creatorId",
      "-password"
    );
    res.json(posts);
  } catch (err) {
    res.json({ message: err });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "creatorId comments.creatorId",
      "-password"
    );

    res.json(post);
  } catch (err) {
    res.json({ message: err });
  }
};
exports.createPost = createPost;
exports.deletePost = deletePost;
exports.getPosts = getPosts;
exports.getPost = getPost;
