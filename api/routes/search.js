const express = require("express");
const router = express.Router();
const middleWare = require("../middlewares/authMiddleware");
const searchController = require("../controllers/search");

router.get("/", middleWare.extractUser, searchController.search);

module.exports = router;
