function studentRoleAuthorization(req, res, next) {
    // check userId in token match userId being looked at
    if (req.role != 'student') {
        res.statusMessage = 'Only student is allowed to do this operation';
        return res.status(401).send();
    }
    next();
}

module.exports = studentRoleAuthorization;