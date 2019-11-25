const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const courseService = require('../services/Course.service');

const service = new courseService;

// api endpoint to get specific course by joinCode
router.get('/:joinCode', async (req, res, next) => {
    const course = await service.getCourseByJoinCode(req.params.joinCode);
    if (course) {
        res.statusMessage = 'Get course is successful';
        return res.status(200).send(course);
    } else {
        res.statusMessage = "Course not found";
        return res.status(404).send();
    }
});

module.exports = router;