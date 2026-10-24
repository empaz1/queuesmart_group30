const { users } = require("./data");

function verifyAdmin(req, res, next) {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const user = users.find(u => u.id === Number(userId));

    if (!user || user.role !== "Administrator") {
        return res.status(403).json({ error: "You do not have Admin access. If you are Admin, try again." });
    }
    req.user = user;
    next();
}

module.exports = { verifyAdmin };