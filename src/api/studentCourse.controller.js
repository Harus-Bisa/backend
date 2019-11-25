const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const StudentCourseService = require('../services/StudentCourse.service');
const studentRoleAuthorization = require('../middlewares/studentRoleAuthorizationMiddleware');
const courseAuthorization = require('../middlewares/courseAuthorizationMiddleware');

const service = new StudentCourseService;

// api endpoint to join class
router.post('/', studentRoleAuthorization, async (req, res, next) => {
    const joinCode = req.body.joinCode;
    const { missingField, addedCourse } = await service.addCourse(req.userId, joinCode);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    }  else if (addedCourse) {
        res.statusMessage = 'Add course is successful';
        return res.status(200).send(addedCourse);
    } else {
        res.statusMessage = 'Course not found';
        return res.status(404).send();
    }
});

// api endpoint to get student's courses
router.get('/', studentRoleAuthorization, async (req, res, next) => {
    const courses = await service.getCourses(req.userId);
    res.statusMessage = "Get student's courses is successful";
    return res.status(200).send(courses);
});

// api endpoint to get a specific student's course
router.get('/:courseId', [studentRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const course = await service.getCourse(req.params.courseId);
    if (course) {
        res.statusMessage = 'Get course is successful';
        return res.status(200).send(course);
    } else {
        res.statusMessage = "Course is not in the student's course list";
        return res.status(404).send();
    }
});

// api endpoint for student to leave a course
router.delete('/:courseId', [studentRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const removedCourse = await service.removeCourse(req.userId, req.params.courseId);
    if (removedCourse) {
        res.statusMessage = 'Remove course is successful';
        return res.status(200).send(removedCourse);
    } else {
        res.statusMessage = "Course not found";
        return res.status(404).send();
    }
});



module.exports = router;