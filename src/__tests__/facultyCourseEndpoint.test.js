const request = require('supertest');
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const app = require('../app');
const config = require('../config');
const User = require('../models/User');

var mongoose = require('mongoose');
var randomId = mongoose.Types.ObjectId();

jest.mock('../db');

const studentPayload = {
    userId: randomId,
    role: 'student'
}
const studentToken = jwt.sign(studentPayload, config.jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
});

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
    endTerm: 'February 2019',
    courseDescription: 'bar',
    random: 'foo'
}

const secondCourseInfo = {
    courseName: 'bar',
    startTerm: 'February 2019',
    endTerm: 'April 2019',
}

const checkCourseResponse = (res, courseInfo, userInfo) => {
    expect(res.body.courseId).toBeDefined();
    expect(res.body._id).not.toBeDefined();
    expect(res.body.courseName).toBe(courseInfo.courseName);
    expect(res.body.startTerm).toBe(courseInfo.startTerm);
    expect(res.body.endTerm).toBe(courseInfo.endTerm);
    expect(res.body.courseDescription).toBe(courseInfo.courseDescription);
    expect(res.body.instructors).toMatchObject([userInfo.firstName + ' ' + userInfo.lastName]);
    expect(res.body.numberOfStudents).toBe(0);
    expect(res.body.numberOfLectures).toBe(0);
    expect(res.body.joinCode).toBeDefined();
    expect(res.body.lectures).not.toBeDefined();
    expect(res.body.students).not.toBeDefined();
    expect(res.body.instructorsId).not.toBeDefined();
    expect(res.body.lecturesId).not.toBeDefined();
    expect(res.body.random).not.toBeDefined();
};

describe('Auth endpoints', () => {
    let token;
    let userId;
    let courseId;
    let secondCourseId;
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

    it('create course as student should fail', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('create course with missing field should fail', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            courseName: 'foo'
        });
        expect(res.statusCode).toEqual(500);
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
        expect(res.body.courseId).toBeDefined();
        checkCourseResponse(res, courseInfo, userInfo);

        courseId = res.body.courseId;
        done();
    });

    it("course should be added to user's course list", async (done) => {
        const user = await User.findById(userId);
        const courses = user.coursesId.map(course => course.toString());
        expect(courses).toMatchObject([courseId]);
        done();
    });

    it('get course with wrong token should fail', async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + courseId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toBe(401);
        done();
    });

    it('get course by non existent courseId should fail', async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + randomId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        done();
    });

    it('get course should succeed', async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + courseId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body.courseId).toBe(courseId);
        checkCourseResponse(res, courseInfo, userInfo);
        
        done();
    });

    it('create second course with should succeed', async (done) => {
        const res = await request(app)
        .post('/faculty/courses/')
        .set('Authorization', 'Bearer ' + token)
        .send({
            courseName: secondCourseInfo.courseName,
            startTerm: secondCourseInfo.startTerm,
            endTerm: secondCourseInfo.endTerm
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body.courseId).toBeDefined();

        secondCourseId = res.body.courseId;
        done();
    });

    it("second course should be added to user's course list", async (done) => {
        const user = await User.findById(userId).lean();
        const courses = user.coursesId.map(course => course.toString());
        expect(courses).toMatchObject([courseId, secondCourseId]);
        done();
    });

    it("get faculty's courses should succeed", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        res.body.forEach(course => {
            expect(course).not.toBeNull();
        });
        
        done();
    });

    it("get non existent faculty's courses should return empty array", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/')
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(0);
        
        done();
    });

    it('update course by non existent courseId should fail', async (done) => {
        const res = await request(app)
        .put('/faculty/courses/' + randomId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('update course should succeed', async (done) => {
        const newStartTerm = 'June 2000';
        const newEndTerm = 'September 2000';
        const res = await request(app)
        .put('/faculty/courses/' + courseId)
        .set('Authorization', 'Bearer ' + token)
        .send({
            random: 'random',
            startTerm: newStartTerm,
            endTerm: newEndTerm,
            _id: 'random'
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.courseId).toBe(courseId);
        expect(res.body.startTerm).toBe(newStartTerm);
        expect(res.body.endTerm).toBe(newEndTerm);
        expect(res.body.random).not.toBeDefined();

        done();
    });

    it("delete course should succeed", async (done) => {
        const res = await request(app)
        .delete('/faculty/courses/' + courseId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body.courseId).toBe(courseId);
        
        done();
    });

    it("get deleted course should fail", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/' + courseId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        done();
    });

    it("faculty's courses should decrease", async (done) => {
        const res = await request(app)
        .get('/faculty/courses/')
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
        res.body.forEach(course => {
            expect(course).not.toBeNull();
        });
        done();
    });

    it("delete non existent course should fail", async (done) => {
        const res = await request(app)
        .delete('/faculty/courses/' + courseId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toBe(404);
        
        done();
    });

});