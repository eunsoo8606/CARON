const jwt = require('jsonwebtoken');

/**
 * 관리자 권한 확인 미들웨어
 */
const authAdmin = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) return res.redirect('/console');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminToken');
        return res.redirect('/console');
    }
};

module.exports = {
    authAdmin
};
