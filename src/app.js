const express = require('express');
const cors = require('cors');

const db = require('./db');
const verifyTokenMiddleware = require('./middlewares/verifyTokenMiddleware');

const app = express();

app.use(cors());

var authController = require('./api/auth.controller');
app.use('/', authController);
const courseController = require('./api/course.controller');
app.use('/courses', courseController);

// all the routes below require authenctication
app.use(verifyTokenMiddleware);

const userController = require('./api/user.controller');
app.use('/users', userController);
const facultyCourseController = require('./api/facultyCourse.controller');
app.use('/faculty/courses', facultyCourseController);
const studentCourseController = require('./api/studentCourse.controller');
app.use('/student/courses', studentCourseController);

const facultyLectureController = require('./api/facultyLecture.controller');
app.use('/faculty', facultyLectureController);
const studentLectureController = require('./api/studentLecture.controller');
app.use('/student', studentLectureController);

const facultyQuizController = require('./api/facultyQuiz.controller');
app.use('/faculty', facultyQuizController);
const studentQuizController = require('./api/studentQuiz.controller');
app.use('/student', studentQuizController);

module.exports = app;