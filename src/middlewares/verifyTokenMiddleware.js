var jwt = require('jsonwebtoken');
var config = require('../config');

function verifyToken(req, res, next) {
	// check for Authorization header
	if (!req.headers['authorization']) {
		res.statusMessage = 'No authorization header provided';
		return res.status(401).send();
	}

	var token = req.headers['authorization'].split(" ")[1];
	res.statusMessage = 'No token is provided';
	if (!token) return res.status(401).send();

	// verify token signature
  	jwt.verify(token, config.jwtSecret, function(err, decoded) {
		req.userId = decoded.userId;
		req.role = decoded.role;
		next();
	});
}
module.exports = verifyToken;