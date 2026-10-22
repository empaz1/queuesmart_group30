const queueList = document.getElementById("queue_list");
const queueMessage = document.getElementById("no_queue_message");

const manageModal = document.getElementById("manage_modal");
const modalCloseButton = document.getElementById("close_modal_button");

const modalTitle = document.getElementById("modal_title");
const queueUsers = document.getElementById("queue_users");
const serveButton = document.getElementById("serve_button");

let currentQueue = null;
let q_data = [];


async function fetchQueues() {
    try{
        const q_response = await fetch("/api/queues");
        const s_response = await fetch("/api/services")

        if(!q_response.ok || !s_response.ok){
            throw new Error("Failed to fetch data");
        }

        const queues = await q_response.json();
        const services = await s_response.json();
        
        q_data = queues.map(queue => {
            const serv = services.find(
                s => s.id === queue.serviceId
            );

            return {
                serviceId: queue.serviceId,
                Service: serv ? serv.name : "Unknown Service",
                Priority: serv ? serv.priority : "Unknown",
                Duration: serv ? serv.duration : 0,
                Users: queue.users.map(user => ({
                    id: user.id,
                    name: user.name
                }))
            };
        });

        show_queue();
    }

    catch(error){
        console.error("Error: ", error);
    }
}

async function reorder(queue){
    const userIds = queue.Users.map(user => user.id);

    try{
        const response = await fetch(`/api/queues/${queue.serviceId}/reorder`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({userIds})
            }
        );

        if(!response.ok){
            throw new Error("Failed to reorder users");
        }

        await fetchQueues();

        currentQueue = q_data.find(q=> q.serviceId === queue.serviceId);

        if(currentQueue){
            show_users(currentQueue);
        }
    }
    catch(error){
        console.error("Error: ", error);
        alert("Failed to reorder users");
        await fetchQueues();

        currentQueue = q_data.find(q=> q.serviceId === queue.serviceId);

        if(currentQueue){
            show_users(currentQueue);
        }
    }
}

function show_users(queue) {
    queueUsers.innerHTML = "";

    if(queue.Users.length === 0) {
        queueUsers.innerHTML = "<p>No users waiting in the queue.</p>";
        serveButton.disabled = true;
        return;
    }
    serveButton.disabled = false;

    for (const user of queue.Users){
        const userDiv = document.createElement("div");
        userDiv.className = "queue_user";

        userDiv.innerHTML = `
            <span>${user.name}</span>

            <div class="user_buttons">
                <button class="up_button">↑</button>
                <button class="down_button">↓</button>
                <button class="remove_button">Remove</button>
            </div>
        `;
        const upButton = userDiv.querySelector(".up_button");
        upButton.addEventListener("click", async function(){
            const userInd = queue.Users.indexOf(user);
            if (userInd > 0) {
                const temp = queue.Users[userInd - 1];
                queue.Users[userInd - 1] = queue.Users[userInd];
                queue.Users[userInd] = temp;

                await reorder(queue);
            }
        });
        const downButton = userDiv.querySelector(".down_button");
        downButton.addEventListener("click", async function(){
            const userInd = queue.Users.indexOf(user);
            if (userInd < queue.Users.length - 1) {
                const temp = queue.Users[userInd + 1];
                queue.Users[userInd + 1] = queue.Users[userInd];
                queue.Users[userInd] = temp;
                await reorder(queue)
            }
        });
        const removeButton = userDiv.querySelector(".remove_button");
        removeButton.addEventListener("click", async function(){
            try{
                const response = await fetch(`/api/queues/${queue.serviceId}/users/${user.id}`,
                    {
                        method: "DELETE"
                    }
                );

                if(!response.ok){
                    throw new Error("User uable to be removed");
                }

                await fetchQueues();

                currentQueue = q_data.find(q => q.serviceId === queue.serviceId);

                if(currentQueue){
                    show_users(currentQueue);
                }
            }
            catch(error){
                console.error("Error: ", error);
                alert("User unable to be removed");
            }
        });
        queueUsers.appendChild(userDiv);
    
    }
}


function show_queue() {
    queueList.innerHTML = "";
    if (q_data.length === 0) {
        queueMessage.style.display = "block";
        return;
    }

    queueMessage.style.display = "none";
    for (const queue of q_data) {
        const queueCard = document.createElement("div");
        queueCard.className = "queue_card";
        queueCard.innerHTML = `
            <h3>${queue.Service}</h3>
            <p>People Waiting: ${queue.Users.length}</p>
            <p> Priority: ${queue.Priority}</p>
            <p> Expected Duration: ${queue.Duration} minutes</p>
            <button class="manage_queue_button">Manage Queue</button>
        `;
        const manageButton = queueCard.querySelector(".manage_queue_button");
        
        manageButton.addEventListener("click", function(){
            currentQueue = queue;
            modalTitle.textContent = queue.Service;
            show_users(queue);
            manageModal.style.display = "flex";
        });

        
        queueList.appendChild(queueCard);
    }
}

modalCloseButton.addEventListener("click", function(){
    manageModal.style.display = "none";
});

serveButton.addEventListener("click", async function(){
    if(currentQueue === null || currentQueue.Users.length === 0) {
        return;
    }

    const servId = currentQueue.serviceId;

    try{
        const response = await fetch(`/api/queues/${servId}/serve`,{
            method: "POST"
        });
        if (!response.ok){
            throw new Error("Failed to serve next user");
        }
        await fetchQueues();

        currentQueue = q_data.find(q => q.serviceId === servId);

        if(currentQueue){
            show_users(currentQueue);
        }

    }
    catch(error){
        console.error("Error: ", error);
        alert("Failed to serve next user");
    }
});
fetchQueues();