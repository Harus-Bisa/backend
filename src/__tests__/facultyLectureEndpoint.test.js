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

const secondUserInfo = {
    email: randomstring.generate(),
    password: 'wilsonburnawan',
    firstName: 'Wilson Jr.',
    lastName: 'Wilson Jr.',
    role: 'faculty',
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

const checkLectureResponse = (res, courseId) => {
    expect(res.body.lectureId).toBeDefined();
    expect(res.body._id).not.toBeDefined();
    expect(res.body.date).toBe(lectureInfo.date);
    expect(res.body.description).toBe(lectureInfo.description);
    expect(res.body.participationRewardPercentage).toBe(lectureInfo.participationRewardPercentage);
    expect(res.body.live).toBeDefined();
    expect(res.body.hasLived).toBeDefined();
    expect(res.body.attendanceNumber).toBe(0);
    expect(res.body.studentsAttendace).not.toBeDefined();
    expect(res.body.quizzes).not.toBeDefined();
    expect(res.body.random).not.toBeDefined();
};

describe('Auth endpoints', () => {
    let token;
    let secondFacultyToken;
    let courseId;
    let lectureId;
    let secondLectureId;
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

    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(secondUserInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: secondUserInfo.email,
            password: secondUserInfo.password,
        });
        expect(res.statusCode).toEqual(200);

        secondFacultyToken = res.body.token;
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
            participationRewardPercentage: lectureInfo.participationRewardPercentage,
            random: lectureInfo.random
        });
        expect(res.statusCode).toEqual(201);
        checkLectureResponse(res, courseId);

        lectureId = res.body.lectureId;
        done();
    });

    it('create second lecture should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            date: secondLectureInfo.date,
            description: secondLectureInfo.description,
            participationRewardPercentage: secondLectureInfo.participationRewardPercentage
        });
        expect(res.statusCode).toEqual(201);
        secondLectureId = res.body.lectureId;
        done();
    });

    it('create lecture for non existent courseId should fail', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + randomId + '/lectures/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            date: secondLectureInfo.date,
            description: secondLectureInfo.description,
            participationRewardPercentage: secondLectureInfo.participationRewardPercentage
        });
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('create lecture with missing field should fail', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            date: lectureInfo.date
        });
        expect(res.statusCode).toEqual(500);
        done();
    });

    it("lecture should be added to course's lecture list", async (done) => {
        const course = await Course.findById(courseId);
        const lectures = course.lecturesId.map(lectureId => lectureId.toString());
        expect(lectures).toMatchObject([lectureId, secondLectureId]);
        done();
    });

    it("get course's lectures should succeed", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        res.body.forEach(lecture => {
            expect(lecture).not.toBeNull();
        });
        done();
    });

    it("get non existent course's lectures should fail", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + randomId + '/lectures/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        done();
    });

    it('get lecture should succeed', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body.lectureId).toBe(lectureId);
        checkLectureResponse(res, courseId);
        done();
    });

    it('get lecture by non existent lectureId should fail', async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + randomId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        done();
    });

    it("get lecture from a course not in user's course list should fail", async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + secondFacultyToken);
        expect(res.statusCode).toBe(401);
        done();
    });

    it("get lecture from a non existent user should fail", async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toBe(401);
        done();
    });

    it('update lecture by non existent lectureId should fail', async (done) => {
        const res = await request(app)
        .put('/faculty/lectures/' + randomId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('update lecture should succeed', async (done) => {
        const newDate = 1111;
        const newDescription = 'baz';
        const live = false;
        const res = await request(app)
        .put('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + token)
        .send({
            random: 'random',
            date: newDate,
            description: newDescription,
            live: live,
            _id: 'random'
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.lectureId).toBe(lectureId);
        expect(res.body.date).toBe(newDate);
        expect(res.body.description).toBe(newDescription);
        expect(res.body.random).not.toBeDefined();
        expect(res.body.studentsAttendace).not.toBeDefined();
        expect(res.body.hasLived).toBe(false);

        done();
    });

    it('update lecture to be live should make hasLived to be true', async (done) => {
        const live = true;
        const res = await request(app)
        .put('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + token)
        .send({
            live: live
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.lectureId).toBe(lectureId);
        expect(res.body.live).toBe(true);
        expect(res.body.hasLived).toBe(true);

        done();
    });

    it("delete lecture should succeed", async (done) => {
        const res = await request(app)
        .delete('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body.lectureId).toBe(lectureId);
        
        done();
    });

    it("delete non existent (deleted) lecture should fail", async (done) => {
        const res = await request(app)
        .delete('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        
        done();
    });

    it("get deleted lecture should fail", async (done) => {
        const res = await request(app)
        .get('/faculty/lectures/' + lectureId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        done();
    });

    it("course's lectures should decrease", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + courseId + '/lectures/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        res.body.forEach(lecture => {
            expect(lecture).not.toBeNull();
        });
        done();
    });

});