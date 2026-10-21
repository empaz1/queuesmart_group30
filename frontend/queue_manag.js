const queueList = document.getElementById("queue_list");
const queueMessage = document.getElementById("no_queue_message");

const manageModal = document.getElementById("manage_modal");
const modalCloseButton = document.getElementById("close_modal_button");

const modalTitle = document.getElementById("modal_title");
const queueUsers = document.getElementById("queue_users");
const serveButton = document.getElementById("serve_button");

let currentQueue = null;

const mockQueueData = [
    {
        Service: "Academic Advising",
        Priority: "High",
        Duration: 45,
        Users: ["Weston Lee", "Maria Florez", "Craig McDonald"]
    }
];


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
            <span>${user}</span>

            <div class="user_buttons">
                <button class="up_button">↑</button>
                <button class="down_button">↓</button>
                <button class="remove_button">Remove</button>
            </div>
        `;
        const upButton = userDiv.querySelector(".up_button");
        upButton.addEventListener("click", function(){
            const userInd = queue.Users.indexOf(user);
            if (userInd > 0) {
                const temp = queue.Users[userInd - 1];
                queue.Users[userInd - 1] = queue.Users[userInd];
                queue.Users[userInd] = temp;
                show_users(queue);
            }
        });
        const downButton = userDiv.querySelector(".down_button");
        downButton.addEventListener("click", function(){
            const userInd = queue.Users.indexOf(user);
            if (userInd < queue.Users.length - 1) {
                const temp = queue.Users[userInd + 1];
                queue.Users[userInd + 1] = queue.Users[userInd];
                queue.Users[userInd] = temp;
                show_users(queue);
            }
        });
        const removeButton = userDiv.querySelector(".remove_button");
        removeButton.addEventListener("click", function(){
            const userInd = queue.Users.indexOf(user);
            queue.Users.splice(userInd, 1);
            show_users(queue);
            show_queue();
        });
        queueUsers.appendChild(userDiv);
    
    }
}


function show_queue() {
    queueList.innerHTML = "";
    if (mockQueueData.length === 0) {
        queueMessage.style.display = "block";
        return;
    }

    queueMessage.style.display = "none";
    for (const queue of mockQueueData) {
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

serveButton.addEventListener("click", function(){
    if(currentQueue !== null && currentQueue.Users.length > 0) {
        currentQueue.Users.shift();
        show_users(currentQueue);
        show_queue();
    }
});
show_queue();