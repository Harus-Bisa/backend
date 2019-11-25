var mongoose = require('mongoose');  
var lectureSchema = new mongoose.Schema({   
    courseId: mongoose.Schema.Types.ObjectId,
    date: Number,
    description: String,
    participationRewardPercentage: Number,
    live: Boolean,
    hasLived: Boolean,
    studentsAttendance: [mongoose.Schema.Types.ObjectId],
    quizzes: [{
        question: String,
        answerOptions: [String],
        correctAnswerIndex: Number,
        duration: Number,
        includeForGrading: Boolean,
        started: Boolean,
        pointWorth: Number,
        participants: Map
    }]
});

lectureSchema.statics.updateById = function (lectureId, updatedInfo) {
    return this.findByIdAndUpdate(lectureId, {$set: updatedInfo}, {new: true});
}

// add student's user Id to the lecture attendance list
lectureSchema.statics.addStudentAttendance = function (lectureId, studentId) {
    return this.findByIdAndUpdate(lectureId, {$addToSet: {studentsAttendance: studentId}}, {new: true});
}

lectureSchema.statics.addQuiz = function (lectureId, quizInfo) {
    return this.findByIdAndUpdate(lectureId, {$addToSet: {quizzes: quizInfo}}, {new: true});
}

lectureSchema.methods.toFaculty = function() {
    var lecture = this.toObject();

    lecture.lectureId = lecture._id;
    lecture.attendanceNumber = lecture.studentsAttendance.length;
    delete lecture._id;
    delete lecture.studentsAttendance;
    delete lecture.quizzes;
    delete lecture.__v;

    return lecture;
}

lectureSchema.methods.toStudent = function(studentId) {
    var lecture = this.toObject();

    lecture.lectureId = lecture._id;

    let studentAttendLecture = false;
    studentAttendLecture = lecture.studentsAttendance.some(function (id) {
        return id.equals(studentId);
    });
    lecture.attendance = studentAttendLecture;
    delete lecture._id;
    delete lecture.studentsAttendance;
    delete lecture.quizzes;
    delete lecture.live;
    delete lecture.hasLived;
    delete lecture.__v;

    return lecture;
}

module.exports = mongoose.model('Lecture', lectureSchema);