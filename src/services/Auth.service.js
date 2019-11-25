const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const config = require('../config');
const UserService = require('../services/User.service');

const userService = new UserService;


class AuthService {
    /*
    Service to handle authentication logic
    Will return message, statusCode, and data
    */
    async signup(userInfo) {
        // logic for user signup and creating account
        let missingField;
        let userAlreadyExist = false;
        let newUser;

        const requiredField = new Set(['firstName', 'lastName', 'email', 'school', 'role', 'password']);
        
        // check for every required field
        for (let field of requiredField) {
            if (field in userInfo === false) {
                missingField = field;
                break;
            }
        }

        if (missingField === undefined) {
            // hashed user password with 10 salt rounds
            userInfo.password = bcrypt.hashSync(userInfo.password, 10);
            let existingUser = await userService.getUserByEmail(userInfo.email);
            if (!existingUser) { // email is not used yet
                newUser = await userService.createUser(userInfo);
            } else {
                userAlreadyExist = true;
            }
        }

        return { missingField, userAlreadyExist, newUser };
    }

    async login(userInfo) {
        // logic for user login
        let missingField;
        let authorized = false;
        let credential;

        const requiredField = new Set(['email', 'password']);
        
        // check for all required field
        for (let field of requiredField) {
            if (field in userInfo === false) {
                missingField = field;
                break;
            }
        }

        if (missingField === undefined) { 
            let user = await User.findByEmail(userInfo.email);
            // make sure that email can be found in db
            if (user) {
                const correctPassword = user.password;
                const passwordMatch = bcrypt.compareSync(userInfo.password, correctPassword);
                if (passwordMatch) {
                    authorized = true;
                    user = user.toClient();
                    const payload = {
                        userId: user.userId,
                        role: user.role
                    }
                    const token = jwt.sign(payload, config.jwtSecret, {
                        expiresIn: 86400 // expires in 24 hours
                    });
                    
                    credential = {
                        userId: user.userId,
                        role: user.role,
                        token: token
                    };
                }
            } 
        } 
        return {missingField, authorized, credential};
    }
}

module.exports = AuthService;