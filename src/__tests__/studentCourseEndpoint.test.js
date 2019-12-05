const request = require('supertest');
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const app = require('../app');
const config = require('../config');
const User = require('../models/User');
const Course = require('../models/Course');

var mongoose = require('mongoose');
var randomId = mongoose.Types.ObjectId();

jest.mock('../db');

const facultyPayload = {
    userId: randomId,
    role: 'faculty'
}
const facultyTestToken = jwt.sign(facultyPayload, config.jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
});

const fakePayload = {
    userId: randomId,
    role: 'student'
}
const fakeToken = jwt.sign(fakePayload, config.jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
});

const facultyInfo = {
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
    endTerm: 'February 2019',
    courseDescription: 'bar',
    random: 'foo'
}

const checkCourseResponse = (res, courseInfo, facultyInfo) => {
    expect(res.body.courseName).toBe(courseInfo.courseName);
    expect(res.body.startTerm).toBe(courseInfo.startTerm);
    expect(res.body.endTerm).toBe(courseInfo.endTerm);
    expect(res.body.courseDescription).toBe(courseInfo.courseDescription);
    expect(res.body.instructors).toMatchObject([facultyInfo.firstName + ' ' + facultyInfo.lastName]);
    expect(res.body.numberOfStudents).not.toBeDefined();
    expect(res.body.numberOfLectures).toBe(0);
    expect(res.body.joinCode).toBeDefined();
    expect(res.body.lectures).not.toBeDefined();
    expect(res.body.students).not.toBeDefined();
    expect(res.body.instructorsId).not.toBeDefined();
    expect(res.body.lecturesId).not.toBeDefined();
    expect(res.body.random).not.toBeDefined();
};

describe('Auth endpoints', () => {
    let facultyToken;
    let courseId;
    let joinCode;
    let numberOfUserCourse = 0;
    let studentToken;
    let studentUserId;
    it('faculty signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(facultyInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('student signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(studentInfo);
        expect(res.statusCode).toEqual(201);
        done();
    });

    it('faculty login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: facultyInfo.email,
            password: facultyInfo.password,
        });
        expect(res.statusCode).toEqual(200);

        facultyToken = res.body.token;
        facultyUserId = res.body.userId;
        done();
    });

    it('student login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: studentInfo.email,
            password: studentInfo.password,
        });
        expect(res.statusCode).toEqual(200);

        studentToken = res.body.token;
        studentUserId = res.body.userId;
        done();
    });

    it('create course with should succeed', async (done) => {
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

    it('add course as faculty should fail', async (done) => {
        const res = await request(app)
        .post('/student/courses/')
        .set('Authorization', 'Bearer ' + facultyTestToken);
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('add course without joinCode should fail', async (done) => {
        const res = await request(app)
        .post('/student/courses/')
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            random: 'foo'
        });
        expect(res.statusCode).toEqual(500);
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
        checkCourseResponse(res, courseInfo, facultyInfo);
        numberOfUserCourse += 1;
        done();
    });

    it('add non existent course should fail', async (done) => {
        const res = await request(app)
        .post('/student/courses/')
        .set('Authorization', 'Bearer ' + studentToken)
        .send({
            joinCode: 'foo'
        });
        expect(res.statusCode).toEqual(404);
        done();
    });

    it("course should be added to user's course list", async (done) => {
        const user = await User.findById(studentUserId);
        const courses = user.coursesId.map(course => course.toString());
        expect(courses).toMatchObject([courseId]);
        done();
    });

    it("student should be added to the course's student list", async (done) => {
        const course = await Course.findById(courseId);
        const students = course.studentsId.map(studentId => studentId.toString());
        expect(students).toMatchObject([studentUserId]);
        done();
    });

    it('get course with wrong token should fail', async (done) => {
        const res = await request(app)
        .get('/student/courses/' + courseId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toBe(401);
        done();
    });

    it('get course by non existent courseId should fail', async (done) => {
        const res = await request(app)
        .get('/student/courses/' + randomId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(404);
        done();
    });

    it('get course should succeed', async (done) => {
        const res = await request(app)
        .get('/student/courses/' + courseId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(200);
        expect(res.body.courseId).toBe(courseId);
        checkCourseResponse(res, courseInfo, facultyInfo);
        
        done();
    });

    it("get student's courses should succeed", async (done) => {
        const res = await request(app)
        .get('/student/courses/')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(numberOfUserCourse);
        res.body.forEach(course => {
            expect(course).not.toBeNull();
        });
        
        done();
    });

    it("get non existent student's courses should return empty array", async (done) => {
        const res = await request(app)
        .get('/student/courses/')
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(0);
        
        done();
    });


    it("remove course should succeed", async (done) => {
        const res = await request(app)
        .delete('/student/courses/' + courseId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(200);
        expect(res.body.courseId).toBe(courseId);
        
        numberOfUserCourse -= 1;
        done();
    });

    it("get removed course should fail", async (done) => {
        const res = await request(app)
        .get('/student/courses/' + courseId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(401);
        
        done();
    });

    it("student's courses should decrease", async (done) => {
        const res = await request(app)
        .get('/student/courses/')
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(numberOfUserCourse);
        res.body.forEach(course => {
            expect(course).not.toBeNull();
        });
        done();
    });

    it("student should be removed from the course's student list", async (done) => {
        const course = await Course.findById(courseId);
        const students = course.studentsId.map(studentId => studentId.toString());
        expect(students).toHaveLength(0);
        done();
    });

    it("remove non existent course should fail", async (done) => {
        const res = await request(app)
        .delete('/student/courses/' + randomId)
        .set('Authorization', 'Bearer ' + studentToken);
        expect(res.statusCode).toBe(404);
        
        done();
    });

});