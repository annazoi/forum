const express = require('express');
const router = express.Router();
const { getHeadlines } = require('../controllers/news');

router.get('/headlines', getHeadlines);

module.exports = router;
