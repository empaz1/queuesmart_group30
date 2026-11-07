const request = require("supertest");
const app = require("./app");
const db = require("./db");

jest.mock("./db", () => ({
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn()
}));

describe("Admin Routes", () => {
    const adminID = "admin-uuid-123";
    const regularUserID = "regular-uuid-456";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("GET /api/admin/dashboard returns 401 when x-user-id header is missing", async () => {
        const response = await request(app).get('/api/admin/dashboard');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");

    });

    test("GET /api/admin/dashboard returns 403 when x-user-id header is a non-admin user", async () => {
        db.get.mockImplementationOnce((query, params, callback) => {
            callback(null, {user_id: regularUserID, role: "User" });
        });
        
        const response = await request(app)
            .get('/api/admin/dashboard')
            .set("x-user-id", regularUserID);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("error");
    });

    test("GET /api/admin/dashboard returns metrics and services for Admin", async () => {
        db.get.mockImplementationOnce((query, params, callback) => {
            callback(null, {user_id: adminID, role: "Administrator" });
        });
        db.all.mockImplementationOnce((query, callback) => {
            callback(null, []);
        });

        const response = await request(app)
            .get('/api/admin/dashboard')
            .set("x-user-id", adminID);
            
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("services");
        expect(Array.isArray(response.body.services)).toBe(true);
    });

});