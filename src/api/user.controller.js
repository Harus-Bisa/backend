const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const UserService = require('../services/User.service');
const userAuthorization = require('../middlewares/userAuthorizationMiddleware');

const service = new UserService;

// api endpoint to get user by userId
router.get('/:userId', userAuthorization, async (req, res, next) => {
    const user = await service.getUser(req.params.userId);
    if (user) {
        res.statusMessage = 'Get user is successful';
        return res.status(200).send(user);
    } else {
        res.statusMessage = 'User not found';
        return res.status(404).send();
    }
});

// api endpoint to update user data by userId
router.put('/:userId', userAuthorization, async (req, res, next) => {
    const userInfo = req.body;

    const user = await service.updateUser(req.params.userId, userInfo);
    if (user) {
        res.statusMessage = 'Update user is successful';
        return res.status(200).send(user);
    } else {
        res.statusMessage = 'User not found';
        return res.status(404).send();
    }
});

// api endpoint to delete user data by userId
router.delete('/:userId', userAuthorization, async (req, res, next) => {
    const user = await service.deleteUser(req.params.userId);
    if (user) {
        res.statusMessage = 'Delete user is successful';
        return res.status(200).send(user);
    } else {
        res.statusMessage = 'User not found';
        return res.status(404).send();
    }
});

module.exports = router;

