var mongoose = require('mongoose');  
var courseSchema = new mongoose.Schema({   
    courseName: String,
    startTerm: String,
    endTerm: String,
    courseDescription: String,
    joinCode: {type: String, index: true},
    numberOfStudents: Number,
    numberOfLectures: Number,
    instructors: [String],
    instructorsId: [mongoose.Schema.Types.ObjectId],
    lecturesId: [mongoose.Schema.Types.ObjectId],
    studentsId: [mongoose.Schema.Types.ObjectId]
});

courseSchema.statics.updateById = function (courseId, updatedInfo) {
    return this.findByIdAndUpdate(courseId, {$set: updatedInfo}, {new: true});
}

courseSchema.statics.findByJoinCode = function (joinCode) {
    return this.findOne({joinCode: joinCode});
}

// add student to course student's list
courseSchema.statics.addStudent = function (userId, courseId) {
    return this.findByIdAndUpdate(courseId, {$addToSet: {studentsId: userId}}, {new: true});
}

// remove student from course student's list
courseSchema.statics.removeStudent = function (studentId, courseId) {
    return this.findByIdAndUpdate(courseId, {$pull: {studentsId: mongoose.Types.ObjectId(studentId)}}, {new: true});
}

// add lectureId to course lecture's list
courseSchema.statics.addLecture = function (courseId, lectureId) {
    return this.findByIdAndUpdate(courseId, {$addToSet: {lecturesId: lectureId}}, {new: true});
}

// remove lectureId from course lecture's list
courseSchema.statics.removeLecture = function (courseId, lectureId) {
    return this.findByIdAndUpdate(courseId, {$pull: {lecturesId: mongoose.Types.ObjectId(lectureId)}}, {new: true});
}

courseSchema.methods.toFaculty = function() {
    var course = this.toObject();

    course.courseId = course._id;
    course.numberOfStudents = course.studentsId.length;
    course.numberOfLectures = course.lecturesId.length;
    delete course._id;
    delete course.lectures;
    delete course.instructorsId;
    delete course.studentsId;
    delete course.lecturesId;
    delete course.__v;

    return course;
}

courseSchema.methods.toStudent = function() {
    var course = this.toObject();

    course.courseId = course._id;
    course.numberOfLectures = course.lecturesId.length;
    delete course._id;
    delete course.lectures;
    delete course.instructorsId;
    delete course.studentsId;
    delete course.lecturesId;
    delete course.__v;

    return course;
}

module.exports = mongoose.model('Course', courseSchema);