const Course = require('../models/Course');

class CourseService {
    /*
    Service to handle course logic for both faculty and student
    */
    async getCourseByJoinCode(joinCode) {
        let course = await Course.findOne({joinCode: joinCode});
        if (course) {
            course = course.toObject();
            course.courseId = course._id;
            course.numberOfStudents = course.studentsId.length;
            course.numberOfLectures = course.lecturesId.length;
            delete course._id;
            delete course.lectures;
            delete course.instructorsId;
            delete course.studentsId;
            delete course.lecturesId;
            delete course.__v;
        } 
        console.log(course);
        return course;
    }
}

module.exports = CourseService;