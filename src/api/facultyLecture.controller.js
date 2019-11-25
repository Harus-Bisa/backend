const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const FacultyLectureService = require('../services/FacultyLecture.service');
const facultyRoleAuthorization = require('../middlewares/facultyRoleAuthorizationMiddleware');
const courseAuthorization = require('../middlewares/courseAuthorizationMiddleware');
const lectureAuthorization = require('../middlewares/lectureAuthorizationMiddleware');

const service = new FacultyLectureService;

// api endpoint to create lecture
router.post('/courses/:courseId/lectures', [facultyRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const lectureInfo = req.body;
    const { missingField, course, newLecture } = await service.createLecture(req.params.courseId, lectureInfo);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    }  else if (course) {
        res.statusMessage = 'Create lecture is successful';
        return res.status(201).send(newLecture);
    } else {
        res.statusMessage = 'Specified course not found';
        return res.status(404).send();
    }
});

// api endpoint to get lectures from a course
router.get('/courses/:courseId/lectures', [facultyRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const {course, lectures} = await service.getLectures(req.params.courseId);
    if (course) {
        res.statusMessage = "Get faculty's lectures is successful";
        return res.status(200).send(lectures);
    } else {
        res.statusMessage = 'Specified course not found';
        return res.status(404).send();
    }
});

// api endpoint to get a specific lecture
router.get('/lectures/:lectureId', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const lecture = await service.getLecture(req.params.lectureId);
    if (lecture) {
        res.statusMessage = 'Get lecture is successful';
        return res.status(200).send(lecture);
    } else {
        res.statusMessage = "Specified lecture is not found";
        return res.status(404).send();
    }
});

// api endpoint to update a specific lecture
router.put('/lectures/:lectureId', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const lectureInfo = req.body;

    const updatedLecture = await service.updateLecture(req.params.lectureId, lectureInfo);
    if (updatedLecture) {
        res.statusMessage = 'Update lecture is successful';
        return res.status(200).send(updatedLecture);
    } else {
        res.statusMessage = 'Lecture not found';
        return res.status(404).send();
    }
});

// api endpoint to delete a specific lecture
router.delete('/lectures/:lectureId', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const deletedLecture = await service.deleteLecture(req.params.lectureId);
    if (deletedLecture) {
        res.statusMessage = 'Delete lecture is successful';
        return res.status(200).send(deletedLecture);
    } else {
        res.statusMessage = "Lecture not found";
        return res.status(404).send();
    }
});

module.exports = router;