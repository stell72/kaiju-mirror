const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../Config/prisma');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Wrong email or password.' });
    }
    const token = jwt.sign(
    { userId: user.id, role: user.role, quarterId: user.assignedQuarterId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '8h' }
    );
    res.json({ token, user:{userId: user.id, role: user.role, quarterId: user.assignedQuarterId }});
});

module.exports = router;