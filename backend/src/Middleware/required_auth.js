const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ code: 'NO_TOKEN', message: 'Missing token.' });
    const token = header.replace('Bearer ', '');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        next();
    } catch {
        res.status(401).json({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' });
    }
}

module.exports = requireAuth;