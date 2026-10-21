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

module.exports = { services, queues };