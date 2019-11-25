function userAuthorization(req, res, next) {
    // check userId in token match userId being looked at
    if (req.userId != req.params.userId) {
        res.statusMessage = 'Token is not valid';
        return res.status(401).send();
    }
    next();
}

module.exports = userAuthorization;