const request = require("supertest");
const app = require("./app");
const db = require("./db");

jest.mock("./db", () => ({
    get: jest.fn((query, params, callback) => {
        const cb = typeof params === "function" ? params : callback;
        if (cb) cb(null, {});
    }),
    all: jest.fn((query, params, callback) => {
        const cb = typeof params === "function" ? params : callback;
        if (cb) cb(null, []);
    }),
    run: jest.fn((query, params, callback) => {
        const cb = typeof params === "function" ? params : callback;
        if (cb) cb(null);
    })
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
            const cb = typeof params === "function" ? params : callback;
            cb(null, { user_id: regularUserID, role: "User" });
        });
        
        const response = await request(app)
            .get('/api/admin/dashboard')
            .set("x-user-id", regularUserID);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty("error");
    });

    test("GET /api/admin/dashboard returns metrics and services for Admin", async () => {
        db.get
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, { user_id: adminID, role: "Administrator" });
            })
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, { count: 15 });
            });
        db.all
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, [{ id: 1, name: "Consultation" }]);
            })
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, [{ service_id: 1, user_id: "customer-123" }]);
            });
        const response = await request(app)
            .get('/api/admin/dashboard')
            .set("x-user-id", adminID);

        expect(response.statusCode).toBe(200);
        expect(response.body.totalUsers).toBe(15);
        expect(response.body.totalQueuedUsers).toBe(1);
        expect(response.body.services[0].waiting).toContain("customer-123");
    });

    test("POST /api/admin/queues/call-next returns 404 when queue is empty", async () => {
        db.get
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, { user_id: adminID, role: "Administrator" });
            })
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, null);
            }); 

        const response = await request(app)
            .post('/api/admin/queues/call-next')
            .set("x-user-id", adminID)
            .send({ serviceId: 1 }); 

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("No customers waiting in the queue");
    });

    test("POST /api/admin/queues/call-next returns 200 and calls next user", async () => {
        db.get
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, { user_id: adminID, role: "Administrator" });
            })
            .mockImplementationOnce((query, params, callback) => {
                const cb = typeof params === "function" ? params : callback;
                cb(null, { entry_id: 5, user_id: "customer-123", queue_id: 2, position: 1 });
            });

        db.run.mockImplementationOnce((query, params, callback) => {
            const cb = typeof params === "function" ? params : callback;
            cb(null);
        });

        db.all.mockImplementationOnce((query, params, callback) => {
            const cb = typeof params === "function" ? params : callback;
            cb(null, [{ user_id: "customer-456" }]);
        });

        const response = await request(app)
            .post('/api/admin/queues/call-next')
            .set("x-user-id", adminID)
            .send({ serviceId: 1 });

        expect(response.statusCode).toBe(200);
        expect(response.body.nextUser).toBe("customer-123");
        expect(response.body.remainingQueue).toEqual(["customer-456"]);
    });
});