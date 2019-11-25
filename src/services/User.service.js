const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserService {
    /*
    Service to handle user logic
    Will return message, statusCode, and data
    */
    async createUser(userInfo) {
        let user = await User.create(userInfo);
        if (user) {
            user = user.toClient();
        }

        return user;
    }

    async getUserByEmail(email) {
        let user = await User.findByEmail(email);
        if (user) {
            user = user.toClient();
        }

        return user;
    }

    async getUser(userId) {
        let user = await User.findById(userId);
        if (user) {
            user = user.toClient();
        } 
        
        return user;
    }

    async updateUser(userId, updatedInfo) {
        // hashed password if provided
        if (updatedInfo.newPassword !== undefined) {
            updatedInfo.password = bcrypt.hashSync(updatedInfo.newPassword, 10);
            delete updatedInfo.newPassword;
        }

        let user = await User.updateById(userId, updatedInfo);
        if (user) {
            user = user.toClient();
        } 

        return user;
    }

    async deleteUser(userId) {
        let user = await User.findByIdAndDelete(userId);
        if (user) {
            user = user.toClient();
        }

        return user;
    }

    async addCourse(userId, courseId) {
        let user = await User.addCourse(userId, courseId);
        if (user) {
            user = user.toClient();
        }

        return user;
    }

    async removeCourse(userId, courseId) {
        let user = await User.removeCourse(userId, courseId);
        if (user) {
            user = user.toClient();
        }

        return user;
    }

    async getCoursesId(userId) {
        const user = await User.findById(userId);
        if (user) {
            return user.coursesId;
        } else {
            return [];
        }
    }
}

module.exports = UserService;