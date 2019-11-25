const request = require('supertest');
const randomstring = require("randomstring");
const app = require('../app');

var mongoose = require('mongoose');
var randomId = mongoose.Types.ObjectId();

jest.mock('../db');

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
    let joinCode;
    let courseId;
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

        joinCode = res.body.joinCode;
        courseId = res.body.courseId;
        done();
    });

    it('get course by non existent joinCode should fail', async (done) => {
        const res = await request(app)
        .get('/courses/' + randomId);
        expect(res.statusCode).toBe(404);
        done();
    });

    it('get course by joinCode should succeed', async (done) => {
        const res = await request(app)
        .get('/courses/' + joinCode);
        expect(res.statusCode).toBe(200);
        expect(res.body.courseId).toBe(courseId);
        checkCourseResponse(res, courseInfo, userInfo);
        
        done();
    });
});