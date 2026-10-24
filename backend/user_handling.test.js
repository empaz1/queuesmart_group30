const { verifyAdmin} = require("./user_roles");
const { users } = require("./data");

describe("User Handling, verifyAdmin Tests", () => {
    let req, res, next;

    beforeEach(() => {
        req = {headers: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    test("returns 401 when no user id is provided", () => {
        verifyAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Authentication is required" });
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when user id does not exist", () => {
        req.headers["x-user-id"] = 999999;
        verifyAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "You do not have Admin access" });
        expect(next).not.toHaveBeenCalled();
    });

     test("returns 403 when user is not Admin", () => {
        const regularUser = users.find(u => u.role !== "Administrator");
        req.headers["x-user-id"] = regularUser ? regularUser.id : 2;
        verifyAdmin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "You do not have Admin access" });
        expect(next).not.toHaveBeenCalled();
    });

    test("when attaches user when user is Admin", () => {
        const adminUser = users.find(u => u.role === "Administrator");
        req.headers["x-user-id"] = adminUser ? adminUser.id : 1;
        verifyAdmin(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(adminUser);
    });
});