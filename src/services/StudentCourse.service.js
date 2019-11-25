const Course = require('../models/Course');
const UserService = require('../services/User.service');

const userService = new UserService;

class StudentCourseService {
    /*
    Service to handle student course
    Student cannot edit course or get number of students
    Student can join course by join code and sync the user model with the course model
    */
    async addCourse(userId, joinCode) {
        let missingField;
        let addedCourse;

        // joinCode is required
        if (joinCode === undefined) {
            missingField = 'joinCode';
        }
        
        if (missingField === undefined) {
            addedCourse = await Course.findByJoinCode(joinCode);
            if (addedCourse) {
                addedCourse = addedCourse.toStudent();
                // add student to course student's list
                Course.addStudent(userId, addedCourse.courseId).exec();
                // add course to user's course list
                userService.addCourse(userId, addedCourse.courseId);
            }
        }

        return {missingField, addedCourse};
    }

    async getCourses(userId) {
        let courses = [];
        const userCoursesId = await userService.getCoursesId(userId);
        // wait for all promises to resolve
        courses = await Promise.all(userCoursesId.map(async courseId => this.getCourse(courseId)));
        
        return courses;
    }

    async getCourse(courseId) {        
        let course = await Course.findById(courseId);
        
        if (course) {
            course = course.toStudent();
        } 
        
        return course;
    }

    async removeCourse(userId, courseId) {
        // remove course from user's course list
        userService.removeCourse(userId, courseId);
        // remove user from course's student list
        let course = await Course.removeStudent(userId, courseId);
        if (course) {
            course = course.toStudent();
        }

        return course;
    }

    async getLecturesId(courseId) {
        // helper function for other service
        const course = await Course.findById(courseId);
        if (course) {
            const lecturesId = course.lecturesId;
            return {course, lecturesId};
        } else {
            const lecturesId = [];
            return {course, lecturesId};
        }
    }
}

module.exports = StudentCourseService;