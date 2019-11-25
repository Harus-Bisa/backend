const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const FacultyQuizService = require('../services/FacultyQuiz.service');
const facultyRoleAuthorization = require('../middlewares/facultyRoleAuthorizationMiddleware');
const lectureAuthorization = require('../middlewares/lectureAuthorizationMiddleware');

const service = new FacultyQuizService;

// api endpoint to create a new quiz
router.post('/lectures/:lectureId/quizzes', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const quizInfo = req.body;
    const { missingField, lecture, newQuiz } = await service.createQuiz(req.params.lectureId, quizInfo);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    }  else if (lecture) {
        res.statusMessage = 'Create quiz is successful';
        return res.status(201).send(newQuiz);
    } else {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    }
});

// api endpoint to get quizzes from a lecture
router.get('/lectures/:lectureId/quizzes', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const {lecture, quizzes} = await service.getQuizzes(req.params.lectureId);
    if (lecture) {
        res.statusMessage = 'Get quizzes is successful';
        return res.status(200).send(quizzes);
    } else {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    }
});

// api endpoint to get a specific quiz
router.get('/lectures/:lectureId/quizzes/:quizIndex', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const {lecture, quiz} = await service.getQuiz(req.params.lectureId, req.params.quizIndex);
    if (lecture) {
        res.statusMessage = 'Get quiz is successful';
        return res.status(200).send(quiz);
    } else {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    }
});

// api endpoint to update a specific quiz
router.put('/lectures/:lectureId/quizzes/:quizIndex', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const updatedQuizInfo = req.body;
    const {lecture, updatedQuiz} = await service.updateQuiz(req.params.lectureId, req.params.quizIndex, updatedQuizInfo);
    if (lecture && updatedQuiz) {
        res.statusMessage = 'Update quiz is successful';
        return res.status(200).send(updatedQuiz);
    } else if (lecture && !updatedQuiz) {
        res.statusMessage = 'Specified quizIndex not found';
        return res.status(404).send();
    } else {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    }
});

// api endpoint to delete a specific quiz
router.delete('/lectures/:lectureId/quizzes/:quizIndex', [facultyRoleAuthorization, lectureAuthorization], async (req, res, next) => {
    const {lecture, deletedQuiz} = await service.deleteQuiz(req.params.lectureId, req.params.quizIndex);
    if (lecture && deletedQuiz) {
        res.statusMessage = 'Delete quiz is successful';
        return res.status(200).send(deletedQuiz);
    } else if (lecture && !deletedQuiz) {
        res.statusMessage = 'Specified quizIndex not found';
        return res.status(404).send();
    } else {
        res.statusMessage = 'Specified lecture not found';
        return res.status(404).send();
    }
});

module.exports = router;