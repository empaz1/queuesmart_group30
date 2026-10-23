const request = require("supertest");
const app = require("./app");


const {services} = require("./data")

beforeEach(function(){
    return services.splice(0, services.length, {
        id: 1,
        name: "Academic Advising",
        description: "Academic advising for students",
        duration: 45,
        priority: "High"
    });
});

test("GET /api/services returns all services", async function(){
    const response = await request(app).get("/api/services");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
})

test("POST create a new service", async function(){
    const serv =
    {
        name: "Counseling",
        description: "Mental Help for students in need",
        duration: 60,
        priority: "High"
    }
    const response = await request(app).post("/api/services").send(serv);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Counseling");
})

test("POST denies improper service", async function(){
    const serv =
    {
        name: 55,
        description: "Mental Help for students in need",
        duration: -60,
        priority: "High"
    }
    const response = await request(app).post("/api/services").send(serv);
    expect(response.status).toBe(400);
})

test("DELETE removes service", async function(){
    const response = await request(app).delete("/api/services/1");

    expect(response.status).toBe(200);
    expect(services.length).toBe(0);
})

test("DELETE prevents wrong input", async function(){
    const response = await request(app).delete("/api/services/3");

    expect(response.status).toBe(404);
    expect(services.length).toBe(1);
})

test("PUT sucessfully edits services", async function(){
    const response = await request(app).put("/api/services/1").send({
        name: "Counseling",
        description: "Mental Help for students in need",
        duration: 60,
        priority: "High"
    });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Counseling");
})

test("PUT prevents improper edit on services", async function(){
    const response = await request(app).put("/api/services/1").send({
        name: 55,
        description: "Mental Help for students in need",
        duration: 60,
        priority: "High"
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Service name cannot exceed 100 characters, cannot be empty, and must be a string")
})

