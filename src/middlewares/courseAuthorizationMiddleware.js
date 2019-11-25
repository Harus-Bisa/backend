const Course = require('../models/Course');

async function courseAuthorization(req, res, next) {
    // check userId in token match userId being looked at
    const course = await Course.findById(req.params.courseId);
    if (course) {
        let userIdIsInArray;
        if (req.role === 'faculty') {
            userIdIsInArray = course.instructorsId.some(function (id) {
                return id.equals(req.userId);
            });
        } else if (req.role === 'student') {
            userIdIsInArray = course.studentsId.some(function (id) {
                return id.equals(req.userId);
            });
        }
        if (!userIdIsInArray) {
            res.statusMessage = 'Token is not valid';
            return res.status(401).send();
        }
    }
    
    next();
}

module.exports = courseAuthorization;