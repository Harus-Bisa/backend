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

const studentInfo = {
    email: randomstring.generate(),
    password: 'wilsonburnawan',
    firstName: 'Wilson',
    lastName: 'Wilson',
    role: 'student',
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
    expect(res.body.duration).toBeDefined();
    expect(res.body.started).not.toBeDefined();
    expect(res.body.pointWorth).toBe(quizInfo.pointWorth);
    expect(res.body.includeForGrading).toBe(quizInfo.includeForGrading);
    expect(res.body.participants).not.toBeDefined();
    expect(res.body.random).not.toBeDefined();
};

describe('Auth endpoints', () => {
    let facultyToken;
    let studentToken;
    let courseId;
    let joinCode;
    let lectureId;
    let studentAnswerIndex;
    let studentAnswerForThirdQuiz;
    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(userInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(studentInfo);
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

        facultyToken = res.body.token;
        userId = res.body.userId;
        done();
    });

    it('login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: studentInfo.email,
            password: studentInfo.password,
        });
        expect(res.statusCode).toEqual(200);

        studentToken = res.body.token;
        done();
    });

    it('create course should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/')
        .set('Authorization', 'Bearer ' + facultyToken)
        .send({
            courseName: courseInfo.courseName,
            startTerm: courseInfo.startTerm,
            endTerm: courseInfo.endTerm,
            courseDescription: courseInfo.courseDescription,
            random: courseInfo.random
        });
        expect(res.statusCode).toEqual(201);

        courseId = res.body.courseId;
        joinCode = res.body.joinCode;
        done();
    });

    it('add course should succeed', async (done) => {
        const res = await request(app)
        .post('/student/courses/')
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            joinCode: joinCode
        });
        expect(res.statusCode).toEqual(200);
        done();
    });

    it('create lecture should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + facultyToken)
        .send({
            date: lectureInfo.date,
            description: lectureInfo.description,
            participationRewardPercentage: lectureInfo.participationRewardPercentage
        });
        expect(res.statusCode).toEqual(201);

        lectureId = res.body.lectureId;
        done();
    });

    it('create first quiz should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + facultyToken)
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
        done();
    });

    it('create second quiz should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + facultyToken)
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
        done();
    });

    it('create third quiz should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/lectures/' + lectureId + '/quizzes/')
        .set('Authorization', 'Bearer ' + facultyToken)
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
        done();
    });

    it('answer quiz of a lecture that is not live should fail', async (done) => {
        studentAnswerIndex = 2;
        const res = await request(app)
        .post('/student/lectures/' + lectureId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            studentAnswerIndex: studentAnswerIndex
        });
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('get quiz of a lecture has not lived should fail', async (done) => {
        const res = await request(app)
        .get('/student/lectures/' + lectureId + '/quizzes/0')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('get quizzes of a lecture has not lived should fail', async (done) => {
        const res = await request(app)
        .get('/student/lectures/' + lectureId + '/quizzes')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('update lecture to be live should make hasLived to be true', async (done) => {
        const live = true;
        const res = await request(app)
        .put('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + facultyToken)
        .send({
            live: live
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.hasLived).toBe(true);
        done();
    });

    it('attend lecture should succeed', async (done) => {
        const res = await request(app)
        .post('/student/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(200);
        expect(res.body.lectureId).toBe(lectureId);
        expect(res.body.attendance).toBe(true);

        done();
    });

    it('answer first quiz should succeed', async (done) => {
        studentAnswerIndex = 1;
        const quizIndex = '0';
        const res = await request(app)
        .post('/student/lectures/' + lectureId + '/quizzes/' + quizIndex)
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            studentAnswerIndex: studentAnswerIndex
        });
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res);
        expect(res.body.studentAnswerIndex).toEqual(studentAnswerIndex);
        done();
    });

    it('answer quiz without answer should fail', async (done) => {
        const quizIndex = '1';
        const res = await request(app)
        .post('/student/lectures/' + lectureId + '/quizzes/' + quizIndex)
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            random: 'foo'
        });
        expect(res.statusCode).toEqual(500);
        done();
    });

    it('change first quiz duration to be 0 should succeed', async (done) => {
        const quizIndex = '0';
        const res = await request(app)
        .put('/faculty/lectures/' + lectureId + '/quizzes/' + quizIndex)
        .set('Authorization', 'Bearer ' + facultyToken)
        .send({
            duration: 0
        });
        expect(res.statusCode).toEqual(200);
        done();
    });

    it('answer quiz that has timed out will keep the old answer', async (done) => {
        const newStudentAnswerIndex = 5;
        const quizIndex = '0';
        const res = await request(app)
        .post('/student/lectures/' + lectureId + '/quizzes/' + quizIndex)
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            studentAnswerIndex: newStudentAnswerIndex
        });
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res);
        expect(res.body.studentAnswerIndex).toEqual(studentAnswerIndex);
        done();
    });

    it('answer quiz with invalid index should fail', async (done) => {
        const invalidIndex = '5';
        const res = await request(app)
        .post('/student/lectures/' + lectureId + '/quizzes/' + invalidIndex)
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            studentAnswerIndex: studentAnswerIndex
        });
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('answer third quiz should succeed', async (done) => {
        studentAnswerForThirdQuiz = 3;
        const quizIndex = '2';
        const res = await request(app)
        .post('/student/lectures/' + lectureId + '/quizzes/' + quizIndex)
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            studentAnswerIndex: studentAnswerForThirdQuiz
        });
        expect(res.statusCode).toEqual(200);
        done();
    });

    it('get quizzes should succeed', async (done) => {
        const res = await request(app)
        .get('/student/lectures/' + lectureId + '/quizzes')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(3);
        expect(res.body[0].studentAnswerIndex).toBe(studentAnswerIndex);
        expect(res.body[1].studentAnswerIndex).not.toBeDefined();
        expect(res.body[2].studentAnswerIndex).toBe(studentAnswerForThirdQuiz);
        done();
    });

    it('get quiz should succeed', async (done) => {
        const quizIndex = '0';
        const res = await request(app)
        .get('/student/lectures/' + lectureId + '/quizzes/' + quizIndex)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(200);
        checkQuizResponse(res);
        expect(res.body.studentAnswerIndex).toEqual(studentAnswerIndex);
        done();
    });

    it('get quiz with invalid index should fail', async (done) => {
        const invalidIndex = '8';
        const res = await request(app)
        .get('/student/lectures/' + lectureId + '/quizzes/' + invalidIndex)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(404);
        done();
    });
});