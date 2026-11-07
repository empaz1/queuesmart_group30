const { verifyAdmin} = require("./user_roles");
const db = require("./db");

jest.mock("./db", () => ({
    get: jest.fn()
}));

describe("User Handling, verifyAdmin Tests", () => {
    let req, res, next;

    beforeEach(() => {
        req = {headers: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    test("returns 401 when no user id is provided", () => {
        verifyAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Authentication required." });
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when user id does not exist", () => {
        req.headers["x-user-id"] = "fake-uuid-123";

        db.get.mockImplementation((query, params, callback) => callback(null, undefined));

        verifyAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "You do not have Admin access. If you are Admin, try again." });
        expect(next).not.toHaveBeenCalled();
    });

     test("returns 403 when user is not Admin", () => {
        req.headers["x-user-id"] = "regular-user-uuid";

        db.get.mockImplementation((query, params, callback) => {
             callback(null,{user_id: "regular-user-uuid", role: "User" });
        });

        verifyAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "You do not have Admin access. If you are Admin, try again." });
        expect(next).not.toHaveBeenCalled();
    });

    test("when attaches user when user is Admin", () => {
        req.headers["x-user-id"] = "admin-user-uuid";
        const adminUser = { user_id: "admin-user-uuid", role: "Administrator" };

        db.get.mockImplementation((query, params, callback) => {
             callback(null, adminUser);
        });

        verifyAdmin(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(adminUser);
    });
});