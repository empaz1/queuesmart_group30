const request = require("supertest");
const app = require("./app");
const { users } = require("./data");

describe("Admin Routes", () => {
    let adminID, regularUserID;

    beforeAll(() => {
        const admin = users.find(u => u.role === "Administrator");
        const regular = users.find(u => u.role !== "Administrator");
        adminID = admin ? admin.id : 1;
        regularUserID = regular ? regular.id : 2;
    });

    test("GET /api/admin/dashboard returns 401 when x-user-id header is missing", async () => {
        const response = await request(app).get('/api/admin/dashboard');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error");

    });

    test("GET /api/admin/dashboard returns 403 when x-user-id header is a non-admin user", async () => {
        const response = await request(app)
            .get('/api/admin/dashboard')
            .set("x-user-id", regularUserID);
        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("error");
    });

     test("GET /api/admin/dashboard returns metrics and services for Admin", async () => {
        const response = await request(app)
            .get('/api/admin/dashboard')
            .set("x-user-id", adminID);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("services");
        expect(Array.isArray(response.body.services)).toBe(true);
    });

});