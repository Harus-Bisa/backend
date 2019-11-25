const Lecture = require('../models/Lecture');
const User = require('../models/User');

async function lectureAuthorization(req, res, next) {
    const lecture = await Lecture.findById(req.params.lectureId);
    const user = await User.findById(req.userId);
    if (lecture) {
        const courseId = lecture.courseId;
        let courseIdIsInArray = false;
        if (user) {
            courseIdIsInArray = user.coursesId.some(function (id) {
                return id.equals(courseId);
            });
        } else {
            res.statusMessage = 'User does not exist';
            return res.status(401).send();
        }
        if (!courseIdIsInArray) {
            res.statusMessage = 'Token is not valid';
            return res.status(401).send();
        }
    }
    
    next();
}

module.exports = lectureAuthorization;