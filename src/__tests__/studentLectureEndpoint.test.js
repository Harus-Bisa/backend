const request = require('supertest');
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const app = require('../app');
const config = require('../config');
const Course = require('../models/Course');

var mongoose = require('mongoose');
var randomId = mongoose.Types.ObjectId();

jest.mock('../db');

const fakePayload = {
    userId: randomId,
    role: 'student'
}
const fakeToken = jwt.sign(fakePayload, config.jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
});

const facultyUserInfo = {
    email: randomstring.generate(),
    password: 'wilsonburnawan',
    firstName: 'Wilson',
    lastName: 'Wilson',
    role: 'faculty',
    school: 'UIUC'
};

const studentUserInfo = {
    email: randomstring.generate(),
    password: 'wilsonburnawan',
    firstName: 'Wilson Jr.',
    lastName: 'Wilson Jr.',
    role: 'student',
    school: 'UIUC'
};

const courseInfo = {
    courseName: 'foo',
    startTerm: 'January 2019',
    endTerm: 'February 2019',
    courseDescription: 'bar',
    random: 'foo'
}

const lectureInfo = {
    date: 1234,
    description: 'foo bar',
    participationRewardPercentage: 80,
    random: 'foo'
}

const secondLectureInfo = {
    date: 4321,
    description: 'foo bar',
    participationRewardPercentage: 90
}

const checkLectureResponse = (res, lectureInfo, courseId) => {
    expect(res.body.lectureId).toBeDefined();
    expect(res.body._id).not.toBeDefined();
    expect(res.body.date).toBe(lectureInfo.date);
    expect(res.body.description).toBe(lectureInfo.description);
    expect(res.body.participationRewardPercentage).toBe(lectureInfo.participationRewardPercentage);
    expect(res.body.live).not.toBeDefined();
    expect(res.body.hasLived).not.toBeDefined();
    expect(res.body.attendance).toBeDefined();
    expect(res.body.studentsAttendace).not.toBeDefined();
    expect(res.body.quizzes).not.toBeDefined();
    expect(res.body.random).not.toBeDefined();
};

describe('Auth endpoints', () => {
    let facultyToken;
    let studentToken;
    let courseId;
    let lectureId;
    let secondLectureId;
    let joinCode;
    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(facultyUserInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: facultyUserInfo.email,
            password: facultyUserInfo.password,
        });
        expect(res.statusCode).toEqual(200);

        facultyToken = res.body.token;
        userId = res.body.userId;
        done();
    });

    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(studentUserInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: studentUserInfo.email,
            password: studentUserInfo.password,
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

    it('create lecture should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + facultyToken)
        .send({
            date: lectureInfo.date,
            description: lectureInfo.description,
            participationRewardPercentage: lectureInfo.participationRewardPercentage,
            random: lectureInfo.random
        });
        expect(res.statusCode).toEqual(201);

        lectureId = res.body.lectureId;
        done();
    });

    it('create second lecture should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + facultyToken)
        .send({
            date: secondLectureInfo.date,
            description: secondLectureInfo.description,
            participationRewardPercentage: secondLectureInfo.participationRewardPercentage
        });
        expect(res.statusCode).toEqual(201);
        secondLectureId = res.body.lectureId;
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

    it("get lecture from a course not in user's course list should fail", async (done) => {
        const res = await request(app)
        .get('/student/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(401);
        done();
    });

    it("get lecture from non existent course should fail", async (done) => {
        const res = await request(app)
        .get('/student/courses/' + randomId + '/lectures/')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(404);
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

    it("get course's has lived lectures should succeed", async (done) => {
        const res = await request(app)
        .get('/student/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        res.body.forEach(lecture => {
            expect(lecture).not.toBeNull();
        });
        expect(res.body[0].lectureId).toBe(lectureId);
        done();
    });

    it('get lecture should succeed', async (done) => {
        const res = await request(app)
        .get('/student/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(200);
        expect(res.body.lectureId).toBe(lectureId);
        checkLectureResponse(res, lectureInfo, courseId);

        done();
    });

    it('get lecture by non existent lectureId should fail', async (done) => {
        const res = await request(app)
        .get('/student/lectures/' + randomId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(404);
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

    it('attend lecture by non existent lectureId should fail', async (done) => {
        const res = await request(app)
        .post('/student/lectures/' + randomId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('attend has not lived lecture should fail', async (done) => {
        const res = await request(app)
        .post('/student/lectures/' + secondLectureId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(404);
        done();
    });

});