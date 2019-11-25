const mongoose = require('mongoose');  
const userSchema = new mongoose.Schema({  
	firstName: String,
	lastName:String,
	email: { type: String, index: true},
    school: String,
    role: String,
    password: String,
	isVerified: {type: Boolean, default:false},
	passwordResetToken: String,
	passwordResetExpires: Date,
	coursesId: [mongoose.Schema.Types.ObjectId]
});

userSchema.statics.findByEmail = function (email) {
    return this.findOne({email: email});
};

userSchema.statics.updateById = function (userId, updatedInfo) {
    return this.findByIdAndUpdate(userId, {$set: updatedInfo}, {new: true});
}

userSchema.statics.addCourse = function (userId, courseId) {
    return this.findByIdAndUpdate(userId, {$addToSet: {coursesId: courseId}}, {new: true});
}

userSchema.statics.removeCourse = function (userId, courseId) {
    return this.findByIdAndUpdate(userId, {$pull: {coursesId: mongoose.Types.ObjectId(courseId)}}, {new: true});
}

// helper function to give only the necessary user property
userSchema.methods.toClient = function() {
    var user = this.toObject();

    user.userId = user._id;
    delete user._id;
    delete user.password;
    delete user.isVerified;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.courses;
    delete user.__v;

    return user;
};

module.exports = mongoose.model('User', userSchema);