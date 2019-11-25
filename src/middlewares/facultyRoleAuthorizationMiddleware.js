function facultyRoleAuthorization(req, res, next) {
    // check userId in token match userId being looked at
    if (req.role != 'faculty') {
        res.statusMessage = 'Only faculty is allowed to do this operation';
        return res.status(401).send();
    }
    next();
}

module.exports = facultyRoleAuthorization;