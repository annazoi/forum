const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors');
const formidable = require('express-formidable');
// Import the Routes
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const newsRoutes = require('./routes/news');
const searchRoutes = require('./routes/search');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const forms = multer();

// app.use(formidable());
app.use(express.json({ limit: '100mb' }));
app.use(
	bodyParser.urlencoded({
		limit: '100mb',
		extended: true,
	}),
);
app.use(cors());

// Import the Routes
app.use('/posts', postRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationRoutes);
app.use('/news', newsRoutes);
app.use('/search', searchRoutes);

// hello
app.get('/', (req, res) => {
	res.send('Hello World');
});

// Connect the mongoDB
mongoose.connect(process.env.DB_CONNECTION).then(() => {
	// Listening port
	app.listen(3000, () => {
		console.log('App is running');
	});
});
