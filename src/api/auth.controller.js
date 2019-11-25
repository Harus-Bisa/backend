const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AuthService = require('../services/Auth.service');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const service = new AuthService;

// api endpoint to signup and create account
router.post('/signup', async (req, res, next) => {
    const userInfo = req.body;
 
    const { missingField, userAlreadyExist, newUser } = await service.signup(userInfo);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    } else if (userAlreadyExist) {
        res.statusMessage = 'Email already exists';
        return res.status(500).send();
    } else {
        res.statusMessage = 'Create user is succesful';
        return res.status(201).send(newUser);
    }
});

// api endpoint to login and get token
router.post('/login', async (req, res, next) => {
    const userInfo = req.body;
    
    const {missingField, authorized, credential} = await service.login(userInfo);
    if (missingField) {
        res.statusMessage = missingField + ' is not provided';
        return res.status(500).send();
    } else if (!authorized) {
        res.statusMessagemessage = 'Please provide correct email and password';
        return res.status(401).send();
    } else {
        res.statusMessage = 'Login is successful';
        return res.status(200).send(credential);
    }
});

module.exports = router;
