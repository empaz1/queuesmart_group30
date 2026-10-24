
const services = [
    {
        id: 1,
        name: "Academic Advising",
        description: "Academic advising for students",
        duration: 45,
        priority: "High"
    },
    {
        id: 2,
        name: "Financial Aid",
        description: "Financial aid assistance",
        duration: 8,
        priority: "Normal"
    },
    {
        id: 3,
        name: "IT Help Desk",
        description: "Technical support",
        duration: 6,
        priority: "Normal"
    },
    {
        id: 4,
        name: "Registrar Office",
        description: "Registration and student records",
        duration: 4,
        priority: "Normal"
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

const servedUsers = [];

module.exports = { services, queues, servedUsers };
