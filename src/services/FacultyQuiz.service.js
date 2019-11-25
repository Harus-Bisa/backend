const Lecture = require('../models/Lecture');

class FacultyQuizService {
    /*
    Service to handle faculty quiz
    Faculty can edit quiz and get number of attendance
    Faculty can edit students' answers
    */
    async createQuiz(lectureId, quizInfo) {
        let missingField;
        let lecture;
        let newQuiz;

        const requiredField = ['question', 'answerOptions', 'correctAnswerIndex', 'duration', 'pointWorth', 'includeForGrading'];
        const allowedField = requiredField;
        
        // check for every required field
        for (let field of requiredField) {
            if (field in quizInfo === false) {
                missingField = field;
                break;
            }
        }

        // check for forbidden field
        for (const field in quizInfo) {
            if (!allowedField.includes(field)) {
                delete quizInfo[field];
            }
        }

        if (missingField === undefined) {
            quizInfo.includeForGrading = false;
            quizInfo.started = false;
            quizInfo.participants = {};

            lecture = await Lecture.addQuiz(lectureId, quizInfo);
            if (lecture) {
                newQuiz = quizInfo;
                newQuiz.participants = 0;
            }
        }

        return {missingField, lecture, newQuiz};
    }

    async getQuizzes(lectureId) {
        const lecture = await Lecture.findById(lectureId);
        let quizzes = [];
        if (lecture) {
            quizzes = lecture.quizzes;
            // loop every quiz and transform the data for faculty quiz view
            for (let i=0; i<quizzes.length; i++) {
                let curQuiz = quizzes[i].toObject();
                // get the number of peopole in the attendance list
                curQuiz.participants = Object.keys(curQuiz.participants).length
                delete curQuiz._id;
                quizzes[i] = curQuiz;
            }
        }
        return {lecture, quizzes};
    }

    async getQuiz(lectureId, quizIndex) {
        const lecture = await Lecture.findById(lectureId);
        var quiz;
        if (lecture) {
            // transform the data for faculty quiz view
            quiz = lecture.quizzes[quizIndex].toObject();
            quiz.participants = Object.keys(quiz.participants).length;
            delete quiz._id;
        } 
        
        return {lecture, quiz};
    }

    async updateQuiz(lectureId, quizIndex, updatedInfo) {
        const allowedField = ['question', 'answerOptions', 'correctAnswerIndex', 'duration', 'pointWorth', 'includeForGrading', 'started'];
        // remove forbidden field
        for (const field in updatedInfo) {
            if (!allowedField.includes(field)) {
                delete updatedInfo[field];
            }
        }
        const lecture = await Lecture.findById(lectureId);
        
        let updatedQuizzes = [];
        let indexFound = false;
        let updatedQuiz;
        if(lecture) {
            // check if index is the same, if yes, update, else use the old quiz object
            for (let i = 0; i < lecture.quizzes.length; i++){
                if (i != quizIndex) {
                    updatedQuizzes.push(lecture.quizzes[i]);
                } else {
                    indexFound = true;
                    updatedQuiz = lecture.quizzes[i].toObject();
                    for (const property in updatedInfo) {
                        updatedQuiz[property] = updatedInfo[property];
                    }
                    updatedQuizzes.push(updatedQuiz);
                }
            }
            Lecture.updateById(lectureId, {quizzes: updatedQuizzes}).exec();
        }

        // check if index is valid
        if (indexFound) {
            updatedQuiz.participants = Object.keys(updatedQuiz.participants).length;
            delete updatedQuiz._id;
        } 
        return {lecture, updatedQuiz};
    }

    async deleteQuiz(lectureId, quizIndex) {
        const lecture = await Lecture.findById(lectureId);
        
        let updatedQuizzes = [];
        let indexFound = false;
        if(lecture) {
            // delete by replacing the deleted object with new object
            for (let i = 0; i < lecture.quizzes.length; i++){
                if (i != quizIndex) {
                    updatedQuizzes.push(lecture.quizzes[i]);
                } else {
                    indexFound = true;
                }
            }
            const updatedLecture = await Lecture.updateById(lectureId, {quizzes: updatedQuizzes});
        }

        var deletedQuiz;
        // check whether index is valid and transform the data for facutly quiz view
        if (indexFound) {
            deletedQuiz = lecture.quizzes[quizIndex].toObject();
            deletedQuiz.participants = Object.keys(deletedQuiz.participants).length
            delete deletedQuiz._id;
        } 
        
        return {lecture, deletedQuiz};
    }
}

module.exports = FacultyQuizService;