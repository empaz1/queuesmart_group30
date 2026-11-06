const request = require("supertest");
const app = require("./app");

const db = require("./db");
const fs = require("fs");
const path = require("path");

beforeAll(function(done){
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    db.exec(schema, done);
});


beforeEach(function(done){
    db.exec(`
        DELETE FROM Service;
        INSERT INTO Service (service_name, description, expected_duration, priority_level)
        VALUES ('Financial Aid', 'Financial help with upcoming semesters', 45, 3);`,done);
});

afterAll(function(done){
    db.close(done);
})

test("GET /api/services returns all services", async function(){
    const response = await request(app).get("/api/services");
    expect(response.status).toBe(200);

    expect(response.body.length).toBe(1);

    expect(response.body[0]).toEqual({
        id: 1,
        name: "Financial Aid",
        description: "Financial help with upcoming semesters",
        duration: 45,
        priority: "High"
    });
});
  

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

    const getResponse = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM Service WHERE service_id = ?", [response.body.id], function(err, row){
            if (err) reject(err);
            else resolve(row); 
        });
    });
    
    expect(getResponse).toBeDefined();
    expect(getResponse.service_name).toBe("Counseling");
    expect(getResponse.description).toBe("Mental Help for students in need");
    expect(getResponse.expected_duration).toBe(60);
    expect(getResponse.priority_level).toBe(3);
    
});

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
    expect(response.body.message).toBe("Service deleted");

    const getResponse = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM Service WHERE service_id = ?", [1], function(err, row){
            if (err) reject(err);
            else resolve(row); 
        });
    });
    expect(getResponse).toBeUndefined();
})

test("DELETE prevents wrong input", async function(){
    const response = await request(app).delete("/api/services/3");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Service not found");

    const getResponse = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM Service WHERE service_id = ?", [1], function(err, row){
            if (err) reject(err);
            else resolve(row); 
        });
    });
    expect(getResponse).toBeDefined();
    expect(getResponse.service_name).toBe("Financial Aid");
    expect(getResponse.description).toBe("Financial help with upcoming semesters");
    expect(getResponse.expected_duration).toBe(45);
    expect(getResponse.priority_level).toBe(3);
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
    const getResponse = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM Service WHERE service_id = ?", [response.body.id], function(err, row){
            if (err) reject(err);
            else resolve(row); 
        });
    });
    
    expect(getResponse).toBeDefined();
    expect(getResponse.service_name).toBe("Counseling");
    expect(getResponse.description).toBe("Mental Help for students in need");
    expect(getResponse.expected_duration).toBe(60);
    expect(getResponse.priority_level).toBe(3);
})

test("PUT rejects nonexistent service", async function() {
    const response = await request(app).put("/api/services/999").send({
        name: "Counseling",
        description: "Mental health services",
        duration: 60,
        priority: "High"
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Service not found");
});

test("PUT prevents improper edit on services", async function(){
    const response = await request(app).put("/api/services/1").send({
        name: 55,
        description: "Mental Help for students in need",
        duration: 60,
        priority: "High"
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Service name cannot exceed 100 characters, cannot be empty, and must be a string")
    const getResponse = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM Service WHERE service_id = ?", [1], function(err, row){
            if (err) reject(err);
            else resolve(row); 
        });
    });
    expect(getResponse).toBeDefined();
    expect(getResponse.service_name).toBe("Financial Aid");
    expect(getResponse.description).toBe("Financial help with upcoming semesters");
    expect(getResponse.expected_duration).toBe(45);
    expect(getResponse.priority_level).toBe(3);
})

