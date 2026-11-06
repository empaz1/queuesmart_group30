const request = require("supertest");
const app = require("./app");
const db = require("./db");
const fs = require("fs");
const path = require("path");

beforeAll(function(done) {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    db.exec(schema, done);
});

beforeEach(function(done) {
  
  db.exec(`
        DELETE FROM UserProfile;
        DELETE FROM UserCredentials;
    `, done);
});

afterAll(function(done) {
    db.close(done);
});

test("POST /api/auth/register - Successfully creates user", async function() {
    const response = await request(app)
        .post("/api/auth/register") 
        .send({
            email: "student_e@university.edu",
            password: "securepassword123",
            role: "User"
        });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("userId");
    expect(response.body.message).toBe("Account created.");
});

test("POST /api/auth/register - Fails on duplicate email", async function() {
    const testUser = {
        email: "duplicate@university.edu",
        password: "securepassword123",
        role: "User"
    };

    await request(app).post("/api/auth/register").send(testUser);

    const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);
  
    expect(response.status).toBe(409);
    expect(response.body.error).toBe("Email already in use");
});

test("POST /api/auth/login - Successfully authenticates", async function() {
    
    await request(app).post("/api/auth/register").send({
        email: "login_test@university.edu",
        password: "securepassword123",
        role: "User"
    });

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "login_test@university.edu",
            password: "securepassword123"
        });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("userId");
    expect(response.body.message).toBe("Login successful");
});

test("POST /api/auth/login - Fails on incorrect password", async function() {
    
    await request(app).post("/api/auth/register").send({
        email: "wrongpass_test@university.edu",
        password: "securepassword123",
        role: "User"
    });

    
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "wrongpass_test@university.edu",
            password: "thisisthewrongpassword"
        });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email/ password");
});
