const Lecture = require('../models/Lecture');
const StudentCourseService = require('../services/StudentCourse.service');

const studentCourseService = new StudentCourseService;

class StudentLectureService {
    /*
    Service to handle student lecture
    Student cannot edit lecture
    Student can attend lecture and sync the user model with the course model
    */
    async getLectures(courseId, studentId) {
        const {course, lecturesId} = await studentCourseService.getLecturesId(courseId);
        // wait for the promises to resolve because course only has lecturesId
        // user the getLecture function to filter has lived lecture
        const lectures = await Promise.all(lecturesId.map(async lectureId => this.getLecture(lectureId, studentId)));
        const hasLivedLectures = [];
        lectures.forEach(lecture => {
            if (lecture) {
                hasLivedLectures.push(lecture);
            }
        });
        return {course, hasLivedLectures};
    }

    async getLecture(lectureId, studentId) {
        // resolve lectureId to lecture details and filter lecture that has not lived
        let lecture = await Lecture.findById(lectureId);
        if (lecture && lecture.hasLived == true) {
            return lecture.toStudent(studentId);
        } else {
            return null;
        }
    }

    async attendLecture(lectureId, studentId) {
        // attend lecture and record attendance to the lecture attendance list
        let lecture = await Lecture.findById(lectureId);
        if (lecture && lecture.hasLived === true) {
            lecture = await Lecture.addStudentAttendance(lectureId, studentId);
            lecture = lecture.toStudent(studentId);
        } else {
            lecture = null;
        }

        return lecture;
    }
}

module.exports = StudentLectureService;