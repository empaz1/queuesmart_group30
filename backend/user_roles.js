const db = require("./db");

function verifyAdmin(req, res, next) {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const query = `SELECT user_id, role FROM UserCredentials WHERE user_id = ?`;

    db.get(query, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error during admin verification." });
        }

        if (!row || row.role !== "Administrator") {
            return res.status(403).json({ error: "You do not have Admin access. If you are Admin, try again." });
        }
        req.user = row;
        next();
    });

}

module.exports = { verifyAdmin };
