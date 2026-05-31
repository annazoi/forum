const multer = require("multer");

const VIDEO_MIME = /^video\//i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|3gp)$/i;

const storage = multer.memoryStorage();

const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (VIDEO_MIME.test(file.mimetype) || VIDEO_EXT.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only video files are allowed"));
  },
});

module.exports = uploadVideo;
