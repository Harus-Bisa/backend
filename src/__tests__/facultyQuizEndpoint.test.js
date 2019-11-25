const request = require('supertest');
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const app = require('../app');
const config = require('../config');
const Lecture = require('../models/Lecture');

var mongoose = require('mongoose');
var randomId = mongoose.Types.ObjectId();

jest.mock('../db');

const fakePayload = {
    userId: randomId,
    role: 'faculty'
}
const fakeToken = jwt.sign(fakePayload, config.jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
});

const userInfo = {
    email: randomstring.generate(),
    password: 'wilsonburnawan',
    firstName: 'Wilson',
    lastName: 'Wilson',
    role: 'faculty',
    school: 'UIUC'
};

const courseInfo = {
    courseName: 'foo',
    startTerm: 'January 2019',
    endTerm: 'February 2019'
}

const lectureInfo = {
    date: 1234,
    description: 'foo bar',
    participationRewardPercentage: 80,
    random: 'foo'
}

const quizInfo = {
    question: 'foo',
    pointWorth: 10,
    correctAnswerIndex: 1,
    answerOptions: ['foo', 'bar'],
    duration: 60,
    includeForGrading: false
}

const checkQuizResponse = (res) => {
    expect(res.body.question).toBe(quizInfo.question);
    expect(res.body.answerOptions).toMatchObject(quizInfo.answerOptions);
    expect(res.body.correctAnswerIndex).toBe(quizInfo.correctAnswerIndex);
    expect(res.body.duration).toBe(quizInfo.duration);
    expect(res.body.started).toBeDefined();
    expect(res.body.pointWorth).toBe(quizInfo.pointWorth);
    expect(res.body.includeForGrading).toBe(quizInfo.includeForGrading);
    expect(res.body.participants).toBe(0);
    expect(res.body.random).not.toBeDefined();
};

describe('Auth endpoints', () => {
    let token;
    let courseId;
    let lectureId;
    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(userInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: userInfo.email,
            password: userInfo.password,
        });
        expect(res.statusCode).toEqual(200);

        token = res.body.token;
        userId = res.body.userId;
        done();
    });

    it('create course should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            courseName: courseInfo.courseName,
            startTerm: courseInfo.startTerm,
            endTerm: courseInfo.endTerm,
            courseDescription: courseInfo.courseDescription,
            random: courseInfo.random
        });
        expect(res.statusCode).toEqual(201);

        courseId = res.body.courseId;
        done();
    });

    it('create lecture should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            date: lectureInfo.date,
            description: lectureInfo.description,
            participationRewardPercentage: lectureInfo.participationRewardPercentage
        });
        expect(res.statusCode).toEqual(201);

        lectureId = res.body.lectureId;
        done();
    });

    it('create quiz should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            question: quizInfo.question,
            pointWorth: quizInfo.pointWorth,
            correctAnswerIndex: quizInfo.correctAnswerIndex,
            answerOptions: quizInfo.answerOptions,
            duration: quizInfo.duration,
            includeForGrading: quizInfo.includeForGrading,
            random: 'foo'
        });
        expect(res.statusCode).toEqual(201);
        checkQuizResponse(res);
        const lecture = await Lecture.findById(lectureId);
        expect(lecture.quizzes.length).toBe(1);
        done();
    });

    it('create second quiz should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            question: quizInfo.question,
            pointWorth: quizInfo.pointWorth,
            correctAnswerIndex: quizInfo.correctAnswerIndex,
            answerOptions: quizInfo.answerOptions,
            duration: quizInfo.duration,
            includeForGrading: quizInfo.includeForGrading,
            random: 'foo'
        });
        expect(res.statusCode).toEqual(201);
        const lecture = await Lecture.findById(lectureId);
        expect(lecture.quizzes.length).toBe(2);
        done();
    });

    it('create quiz with non existent lecture should fail', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + randomId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            question: quizInfo.question,
            pointWorth: quizInfo.pointWorth,
            correctAnswerIndex: quizInfo.correctAnswerIndex,
            answerOptions: quizInfo.answerOptions,
            duration: quizInfo.duration,
            includeForGrading: quizInfo.includeForGrading,
            random: 'foo'
        });
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('create quiz with missing field should fail', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + randomId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            question: quizInfo.question
        });
        expect(res.statusCode).toEqual(500);
        done();
    });

    it('get quizzes should succeed', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(2);
        res.body.forEach(quiz => {
            expect(quiz).not.toBeNull();
        });
        done();
    });

    it('get quizzes of non existent lecture should fail', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + randomId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('get quiz should succeed', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res)
        done();
    });

    it('get quiz of non existent lecture should fail', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + randomId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('update quiz should succeed', async (done) => {
        const res = await request(app)
        .put('/faculty/lectures/' + lectureId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token)
        .send({
            started: true,
            random: 'foo'
        });
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res);
        expect(res.body.started).toBe(true);
        done();
    });

    it('update quiz of non existent lecture should fail', async (done) => {
        const res = await request(app)
        .put('/faculty/lectures/' + randomId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('update quiz of non existent index should fail', async (done) => {
        const res = await request(app)
        .put('/faculty/lectures/' + lectureId + '/quizzes/5')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('quiz should be updated', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res);
        expect(res.body.started).toBe(true);
        done();
    });

    it('delete quiz should succeed', async (done) => {
        const res = await request(app)
        .delete('/faculty/lectures/' + lectureId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res)
        done();
    });

    it('delete quiz of non existent lecture should fail', async (done) => {
        const res = await request(app)
        .delete('/faculty/lectures/' + randomId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('delete quiz of non existent index should fail', async (done) => {
        const res = await request(app)
        .delete('/faculty/lectures/' + lectureId + '/quizzes/5')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('quizzes should decrease', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(1);
        res.body.forEach(quiz => {
            expect(quiz).not.toBeNull();
        });
        done();
    });
});