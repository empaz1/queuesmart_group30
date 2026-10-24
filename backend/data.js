const users = [
    { id: 1, email: "admin@example.com", username: "admin@example.com", password: "adminpassword", role: "Administrator"},
    { id: 2, email: "jsmith@example.com", username: "jsmith@example.com", password: "password123", role: "User" }
   
];
const services = [
    {
        id: 1,
        name: "Academic Advising",
        description: "Academic advising for students",
        duration: 45,
        priority: "High"
    }
];

const queues = [
    {
        serviceId: 1,
        users: [
            { id: 1, name: "Weston Lee" },
            { id: 2, name: "Maria Florez" },
            { id: 3, name: "Craig McDonald" }
        ]
    }
];

module.exports = { users, services, queues };
