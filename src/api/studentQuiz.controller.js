const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const StudentQuizService = require('../services/StudentQuiz.service');
const studentRoleAuthorization = require('../middlewares/studentRoleAuthorizationMiddleware');
const lectureAuthorization = require('../middlewares/lectureAuthorizationMiddleware');

const service = new StudentQuizService;

// api endpoint for student to submit an answer to a quiz
router.post('/lectures/:lectureId/quizzes/:quizIndex', [studentRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const studentAnswer = req.body;
    const { missingField, lecture, answeredQuiz } = await service.answerQuiz(req.params.lectureId, req.params.quizIndex, req.userId, studentAnswer);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    }  else if (lecture && answeredQuiz) {
        res.statusMessage = 'Answer quiz is successful';
        return res.status(200).send(answeredQuiz);
    } else if (!lecture) {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    } else if (!answeredQuiz) {
        res.statusMessage = 'Specified quizIndex not found';
        return res.status(404).send();
    }
});

// api endpoint to get quzzes from a lecture that has lived previously
router.get('/lectures/:lectureId/quizzes', [studentRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const {lecture, quizzes} = await service.getQuizzes(req.params.lectureId, req.userId);
    if (lecture) {
        res.statusMessage = 'Get quizzes is successful';
        return res.status(200).send(quizzes);
    } else {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    }
});


// api endpoint to get quiz from a lecture that has lived previously
router.get('/lectures/:lectureId/quizzes/:quizIndex', [studentRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const {lecture, quiz} = await service.getQuiz(req.params.lectureId, req.params.quizIndex, req.userId);
    if (lecture && quiz) {
        res.statusMessage = 'Get quiz is successful';
        return res.status(200).send(quiz);
    } else if (!lecture) {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    } else {
        res.statusMessage = 'Specified quizIndex not found';
        return res.status(404).send();
    }
});

module.exports = router;