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
    email: 'wilson.burnawan@gmail.com',
    password: 'wilsonburnawan',
    firstName: 'Wilson',
    lastName: 'Wilson',
    role: 'student',
    school: 'UIUC'
};

describe('Auth endpoints', () => {
    let token;
    let userId;
    const newPassword = 'newPassword';
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

    it('get user without authorization header', async (done) => {
        const res = await request(app)
        .get('/users/' + userId);
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('get user without token', async (done) => {
        const res = await request(app)
        .get('/users/' + userId)
        .set('Authorization', 'Bearer ');
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('get user by userId', async (done) => {
        const res = await request(app)
        .get('/users/' + userId)
        .set('Authorization', 'Bearer ' + token)
        expect(res.statusCode).toEqual(200);
        expect(res.body.userId).toBe(userId);
        expect(res.body.email).toBe(userInfo.email);
        expect(res.body.firstName).toBe(userInfo.firstName);
        expect(res.body.lastName).toBe(userInfo.lastName);
        expect(res.body.role).toBe(userInfo.role);
        expect(res.body.school).toBe(userInfo.school);
        expect(res.body.password).not.toBeDefined();
        done();
    });

    it('get user by userId with wrong token', async (done) => {
        const res = await request(app)
        .get('/users/' + userId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('get user by non existent userId', async (done) => {
        const res = await request(app)
        .get('/users/' + randomId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('update user by userId', async (done) => {
        const res = await request(app)
        .put('/users/' + userId)
        .set('Authorization', 'Bearer ' + token)
        .send({
            firstName: 'foo',
            newPassword: newPassword,
            foo: 'bar'
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body.userId).toBe(userId);
        expect(res.body.firstName).toBe('foo');
        expect(res.body.foo).not.toBeDefined();
        done();
    });

    it('login with old password should fail', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: userInfo.email,
            password: userInfo.password,
        });
        expect(res.statusCode).toEqual(401);
        done();
    });

    it('login with new password should succeed', async (done) => {
        const res = await request(app)
        .post('/login')
        .send({
            email: userInfo.email,
            password: newPassword,
        });
        expect(res.statusCode).toEqual(200);
        done();
    });

    it('update user by non existent userId should fail', async (done) => {
        const res = await request(app)
        .put('/users/' + randomId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('delete created user', async (done) => {
        const res = await request(app)
        .delete('/users/' + userId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(200);
        done();
    });

    it('check user is deleted', async (done) => {
        const res = await request(app)
        .get('/users/' + userId)
        .set('Authorization', 'Bearer ' + token);
        expect(res.statusCode).toEqual(404);
        done();
    });

    it('delete user by non existent userId', async (done) => {
        const res = await request(app)
        .delete('/users/' + randomId)
        .set('Authorization', 'Bearer ' + fakeToken);
        expect(res.statusCode).toEqual(404);
        done();
    });
});