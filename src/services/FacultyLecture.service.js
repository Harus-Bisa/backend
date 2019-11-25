const Lecture = require('../models/Lecture');
const FacultyCourseService = require('../services/FacultyCourse.service');

const facultyCourseService = new FacultyCourseService;

class FacultyLectureService {
    /*
    Service to handle faculty lecture
    Faculty can edit lecture and toggle lecture live status
    Student can attend lecture and sync the user model with the course model
    */
    async createLecture(courseId, lectureInfo) {
        let missingField;
        let course;
        let newLecture;

        const requiredField = ['date', 'participationRewardPercentage'];
        const allowedField = ['date', 'description', 'participationRewardPercentage'];
        
        // check for every required field
        for (let field of requiredField) {
            if (field in lectureInfo === false) {
                missingField = field;
                break;
            }
        }

        // check for forbidden field
        for (const field in lectureInfo) {
            if (!allowedField.includes(field)) {
                delete lectureInfo[field];
            }
        }

        if (missingField === undefined) {
            course = await facultyCourseService.getCourse(courseId);

            // initialize fields
            lectureInfo.courseId = courseId;
            lectureInfo.live = false;
            lectureInfo.hasLived = false;
            lectureInfo.studentsAttendance = [];
            lectureInfo.quizzes = [];

            newLecture = await Lecture.create(lectureInfo);
            newLecture = newLecture.toFaculty();
            // add lecture to the course's lecture list
            facultyCourseService.addLecture(courseId, newLecture.lectureId);
        }

        return {missingField, course, newLecture};
    }

    async getLectures(courseId) {
        let lectures = [];
        const {course, lecturesId} = await facultyCourseService.getLecturesId(courseId);
        // wait for the promises to resolve
        lectures = await Promise.all(lecturesId.map(async lectureId => this.getLecture(lectureId)));
        return {course, lectures};
    }

    async getLecture(lectureId) {
        let lecture = await Lecture.findById(lectureId);
        if (lecture) {
            lecture = lecture.toFaculty();
        } 
        
        return lecture;
    }

    async updateLecture(lectureId, updatedInfo) {
        // check for forbidden field
        const allowedField = ['date', 'description', 'participationRewardPercentage', 'live'];

        // check for forbidden field
        for (const field in updatedInfo) {
            if (!allowedField.includes(field)) {
                delete updatedInfo[field];
            }
        }

        // toggle hasLived once the lecture is live
        if ('live' in updatedInfo && updatedInfo['live'] === true) {
            updatedInfo.hasLived = true
        }

        let lecture = await Lecture.updateById(lectureId, updatedInfo);
        if (lecture) {
            lecture = lecture.toFaculty();
        } 

        return lecture;
    }

    async deleteLecture(lectureId) {
        let lecture = await Lecture.findByIdAndDelete(lectureId);
        if (lecture) {
            lecture = lecture.toFaculty();
            // delete the lecture from the course' lecture list
            facultyCourseService.removeLecture(lecture.courseId, lectureId);
        }

        return lecture;
    }

}

module.exports = FacultyLectureService;