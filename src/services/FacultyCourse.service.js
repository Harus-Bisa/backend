const shortid = require('shortid');

const Course = require('../models/Course');
const UserService = require('../services/User.service');

const userService = new UserService;


class FacultyCourseService {
    /*
    Service to handle faculty course
    Faculty cannot join course by joinCode
    For full access to edit course
    */
    async createCourse(userId, courseInfo) {
        let missingField;
        let newCourse;

        const requiredField = ['courseName', 'startTerm', 'endTerm'];
        const allowedField = ['courseName', 'courseDescription', 'startTerm', 'endTerm'];
        
        // check for every required field
        for (let field of requiredField) {
            if (field in courseInfo === false) {
                missingField = field;
                break;
            }
        }

        // check for forbidden field
        for (const field in courseInfo) {
            if (!allowedField.includes(field)) {
                delete courseInfo[field];
            }
        }

        // check for missing field
        if (missingField === undefined) {
            const instructor = await userService.getUser(userId);
            const instructorName = instructor.firstName + ' ' + instructor.lastName;
            courseInfo.instructors = [instructorName]
            courseInfo.instructorsId = [userId];
            courseInfo.joinCode = shortid.generate();
            newCourse = await Course.create(courseInfo);
            newCourse = newCourse.toFaculty();
            // add course to the user's course list
            userService.addCourse(userId, newCourse.courseId);
        }

        return {missingField, newCourse};
    }

    async getCourses(userId) {
        let courses = [];
        const userCoursesId = await userService.getCoursesId(userId);
        // wait for the promises load
        courses = await Promise.all(userCoursesId.map(async courseId => this.getCourse(courseId)));
        
        return courses;
    }

    async getCourse(courseId) {
        let course = await Course.findById(courseId);
        if (course) {
            course = course.toFaculty();
        } 
        
        return course;
    }

    async updateCourse(courseId, updatedInfo) {
         // check for forbidden field
         const allowedField = ['courseName', 'courseDescription', 'startTerm', 'endTerm'];

         for (const field in updatedInfo) {
            if (!allowedField.includes(field)) {
                delete updatedInfo[field];
            }
        }

        let course = await Course.updateById(courseId, updatedInfo);
        if (course) {
            course = course.toFaculty();
        } 

        return course;
    }

    async deleteCourse(userId, courseId) {
        // delete the course from the user model as well
        userService.removeCourse(userId, courseId);
        let course = await Course.findByIdAndDelete(courseId);
        if (course) {
            course.studentsId.forEach(studentId => {
                userService.removeCourse(studentId, courseId);
            });
            course = course.toFaculty();
        }

        return course;
    }

    async addLecture(courseId, lectureId) {
        let course = await Course.addLecture(courseId, lectureId);
        // check if course exist
        if (course) {
            course = course.toFaculty();
        }

        return course;
    }

    async getLecturesId(courseId) {
        const course = await Course.findById(courseId);
        // check if course exist
        if (course) {
            const lecturesId = course.lecturesId;
            return {course, lecturesId};
        } else {
            const lecturesId = [];
            return {course, lecturesId};
        }
    }

    async removeLecture(courseId, lectureId) {
        // use custom model method to remove lecture
        let course = await Course.removeLecture(courseId, lectureId);
        if (course) {
            course = course.toFaculty();
        }

        return course;
    }
}

module.exports = FacultyCourseService;