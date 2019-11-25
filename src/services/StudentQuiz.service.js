const Lecture = require('../models/Lecture');

class StudentQuizService {
    /*
    Service to handle student quiz
    Student get answer quiz is the lecture hasLived and lecture exist
    */
    async answerQuiz(lectureId, quizIndex, userId, studentAnswer) {
        let missingField;
        let lecture;
        let answeredQuiz;

        const requiredField = ['studentAnswerIndex'];
        const allowedField = requiredField;
        
        // check for every required field
        for (let field of requiredField) {
            if (field in studentAnswer === false) {
                missingField = field;
                break;
            }
        }

        // check for forbidden field
        for (const field in studentAnswer) {
            if (!allowedField.includes(field)) {
                delete studentAnswer[field];
            }
        }

        if (missingField === undefined) {
            lecture = await Lecture.findById(lectureId);
            
            // check if lecture is live
            if (lecture.live === false) {
                lecture = undefined;
            }
        
            let updatedQuizzes = [];
            let indexFound = false;
            let updatedQuiz;
            let newStudentAnswerIndex;
            if(lecture) {
                // loop and look for matched index
                for (let i = 0; i < lecture.quizzes.length; i++){
                    if (i != quizIndex) {
                        updatedQuizzes.push(lecture.quizzes[i]);
                    } else {
                        indexFound = true;
                        // insert student's id to course answers' list
                        updatedQuiz = lecture.quizzes[i].toObject();
                        const oldStudentAnswerIndex = updatedQuiz.participants.get(userId);
                        // only change student answer if quiz is still live
                        newStudentAnswerIndex =  updatedQuiz.duration > 0 ? studentAnswer.studentAnswerIndex : oldStudentAnswerIndex;
                        updatedQuiz.participants[userId] = parseInt(newStudentAnswerIndex);
                        answeredQuiz = updatedQuiz

                        // update the database
                        const query = 'quizzes.' + i +'.participants.' + userId;
                        await Lecture.findByIdAndUpdate(lectureId, {$set: {[query]: parseInt(newStudentAnswerIndex)}});
                    }
                }
            }
            // check if index is valid and transform the data for student view
            if (indexFound) {
                answeredQuiz.studentAnswerIndex = newStudentAnswerIndex;
                delete answeredQuiz._id;
                delete answeredQuiz.started;
                delete answeredQuiz.participants;
            } 
        }

        return {missingField, lecture, answeredQuiz};
    }

    async getQuizzes(lectureId, userId) {
        let quizzes = [];
        let lecture = await Lecture.findById(lectureId);

        if (lecture.hasLived === false) {
            lecture = undefined;
        }

        if (lecture) {
            let quiz;
            let studentAnswerIndex;
            for (let i = 0; i < lecture.quizzes.length; i++){
                quiz = lecture.quizzes[i].toObject();
                studentAnswerIndex = quiz.participants.get(userId);
                quiz.studentAnswerIndex = studentAnswerIndex;
                delete quiz._id;
                delete quiz.started;
                delete quiz.participants;
                quizzes.push(quiz);
            }
        }

        return {lecture, quizzes};
        
    }

    async getQuiz(lectureId, quizIndex, userId) {
        // get individual student quiz if lecture hasLived
        let quiz;
        let studentAnswerIndex;
        let lecture = await Lecture.findById(lectureId);

        // check lecture has lived
        if (lecture.hasLived === false) {
            lecture = undefined;
        }

        let indexFound = false;
        if(lecture) {
            // try to loop for match quiz index
            for (let i = 0; i < lecture.quizzes.length; i++){
                if (quizIndex == i) {
                    indexFound = true;
                    quiz = lecture.quizzes[i].toObject();
                    studentAnswerIndex = quiz.participants.get(userId);
                }
            }
        }

        // check if index is valid and transform the data for student quiz view
        if (indexFound) {
            quiz.studentAnswerIndex = studentAnswerIndex;
            delete quiz._id;
            delete quiz.started;
            delete quiz.participants;
        } 
        
        return {lecture, quiz};
    }
}

module.exports = StudentQuizService;