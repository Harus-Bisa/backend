const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const config = require('../config');

var mongoose = require('mongoose');
var randomId = mongoose.Types.ObjectId();

jest.mock('../db');

const payload = {
    userId: randomId,
    role: 'bar'
}
const fakeToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
});

const userInfo = {
    email: 'wilson@gmail.com',
    password: 'wilson',
    firstName: 'Wilson',
    lastName: 'Burnawan',
    role: 'student',
    school: 'UIUC'
};

describe('Auth endpoints', () => {
    let token;
    let userId;
    it('signup should be successful', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(userInfo);
        expect(res.statusCode).toEqual(201);
        expect(res.body.email).toBe(userInfo.email);
        expect(res.body.firstName).toBe(userInfo.firstName);
        expect(res.body.lastName).toBe(userInfo.lastName);
        expect(res.body.role).toBe(userInfo.role);
        expect(res.body.school).toBe(userInfo.school);
        expect(res.body.userId).toBeDefined();
        expect(res.body.password).not.toBeDefined();
        done();
    });

    it('signup with existing email should fail', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send(userInfo);
        expect(res.statusCode).toEqual(500);
        done();
    });

    it('signup with missing field should fail', async (done) => {
        const res = await request(app)
        .post('/signup')
        .send({
            email: 'foo@gmail.com'
        });
        expect(res.statusCode).toEqual(500);
        done();
    });

    it('login should be successful', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: userInfo.email,
            password: userInfo.password,
        })
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('userId');
        expect(res.body).toHaveProperty('role');

        token = res.body.token;
        userId = res.body.userId;
        done();
    });

    it('login with missing field should fail', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: 'foo@gmail.com'
        });
        expect(res.statusCode).toEqual(500);
        done();
    });

    it('login with non existend email should fail', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: 'random@gmail.com',
            password: userInfo.password
        });
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('login with wrong password should fail', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: userInfo.email,
            password: 'random'
        });
        expect(res.statusCode).toEqual(401);
        done();
    });
});