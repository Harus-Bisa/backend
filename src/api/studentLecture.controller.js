const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const StudentLectureService = require('../services/StudentLecture.service');
const studentRoleAuthorization = require('../middlewares/studentRoleAuthorizationMiddleware');
const courseAuthorization = require('../middlewares/courseAuthorizationMiddleware');
const lectureAuthorization = require('../middlewares/lectureAuthorizationMiddleware');

const service = new StudentLectureService;

// api endpoint to get lectures from a student's course
router.get('/courses/:courseId/lectures', [studentRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const {course, hasLivedLectures} = await service.getLectures(req.params.courseId, req.userId);
    if (course) {
        res.statusMessage = "Get student's lectures is successful";
        return res.status(200).send(hasLivedLectures);
    } else {
        res.statusMessage = 'Specified course not found';
        return res.status(404).send();
    }
});

// api endpoint to get a specific lecture from a course that the student is enrolling
router.get('/lectures/:lectureId', [studentRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const lecture = await service.getLecture(req.params.lectureId, req.userId);
    if (lecture) {
        res.statusMessage = 'Get lecture is successful';
        return res.status(200).send(lecture);
    } else {
        res.statusMessage = "Specified lecture is not found";
        return res.status(404).send();
    }
});

// api endpoint to submit attendance to a lecture
router.post('/lectures/:lectureId', [studentRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const attendedLecture = await service.attendLecture(req.params.lectureId, req.userId);
    if (attendedLecture) {
        res.statusMessage = 'Attend lecture is successful';
        return res.status(200).send(attendedLecture);
    } else {
        res.statusMessage = 'Lecture not found';
        return res.status(404).send();
    }
});

module.exports = router;