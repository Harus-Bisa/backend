const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const FacultyCourseService = require('../services/FacultyCourse.service');
const facultyRoleAuthorization = require('../middlewares/facultyRoleAuthorizationMiddleware');
const courseAuthorization = require('../middlewares/courseAuthorizationMiddleware');

const service = new FacultyCourseService;

// api endpoint to create course
router.post('/', facultyRoleAuthorization, async (req, res, next) => {
    const courseInfo = req.body;
    const { missingField, newCourse } = await service.createCourse(req.userId, courseInfo);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    }  else {
        res.statusMessage = 'Create course is successful';
        return res.status(201).send(newCourse);
    }
});

// api endpoint to get user's courses
router.get('/', facultyRoleAuthorization, async (req, res, next) => {
    const courses = await service.getCourses(req.userId);
    res.statusMessage = "Get faculty's courses is successful";
    return res.status(200).send(courses);
});

// api endpoint to get specific course by Id
router.get('/:courseId', [facultyRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const course = await service.getCourse(req.params.courseId);
    if (course) {
        res.statusMessage = 'Get course is successful';
        return res.status(200).send(course);
    } else {
        res.statusMessage = "Course is not in the faculty's course list";
        return res.status(404).send();
    }
});

// api endpoint to update a specific course
router.put('/:courseId', [facultyRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const courseInfo = req.body;

    const updatedCourse = await service.updateCourse(req.params.courseId, courseInfo);
    if (updatedCourse) {
        res.statusMessage = 'Update course is successful';
        return res.status(200).send(updatedCourse);
    } else {
        res.statusMessage = 'Course not found';
        return res.status(404).send();
    }
});

// api endpoint to delete a specific course
router.delete('/:courseId', [facultyRoleAuthorization, courseAuthorization], async (req, res, next) => {
    const deletedCourse = await service.deleteCourse(req.userId, req.params.courseId);
    if (deletedCourse) {
        res.statusMessage = 'Delete course is successful';
        return res.status(200).send(deletedCourse);
    } else {
        res.statusMessage = "Course not found";
        return res.status(404).send();
    }
});

module.exports = router;