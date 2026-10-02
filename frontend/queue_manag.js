const queueList = document.getElementById("queue_list");
const queueMessage = document.getElementById("no_queue_message");

const manageModal = document.getElementById("manage_modal");
const modalCloseButton = document.getElementById("close_modal_button");

const modalTitle = document.getElementById("modal_title");
const queueUsers = document.getElementById("queue_users");
const serveButton = document.getElementById("serve_button");

const mockQueueData = [
    {
        Service: "Academic Advising",
        Priority: "High",
        Duration: 45,
        Users: ["Weston Lee", "Maria Florez", "Craig McDonald"]
    }
];


function show_queue() {
    queueList.innerHTML = "";

    for (const queue of mockQueueData) {
        const queueCard = document.createElement("div");
        queueCard.className = "queue_card";
        queueCard.innerHTML = `
            <h3>${queue.Service}</h3>
            <p> Priority: ${queue.Priority}</p>
            <p> Expected Duration: ${queue.Duration} minutes</p>
            <button class="manage_queue_button">Manage Queue</button>
        `;
        const manageButton = queueCard.querySelector(".manage_queue_button");
        
        manageButton.addEventListener("click", function(){
            modalTitle.textContent = queue.Service;
            queueUsers.innerHTML = "";
            for (const user of queue.Users){
                const userDiv = document.createElement("div");
                userDiv.className = "queue_user";

                userDiv.innerHTML = `
                    <span>${user}</span>
                    <div class="user_controls">
                        <button class="up_button">^</button>
                        <button class="down_button">v</button>
                        <button class="remove_button">Remove</button>
                    </div>
                `;

                const removeButton = userDiv.querySelector(".remove_button");
                removeButton.addEventListener("click", function(){
                    const ind = queue.Users.indexOf(user);
                    queue.Users.splice(ind, 1);
                    userDiv.remove();
                });

                const upButton = userDiv.querySelector(".up_button");
                upButton.addEventListener("click", function(){
                    const ind = queue.Users.indexOf(user);
                    if (ind > 0){
                        const temp = queue.Users[ind - 1];
                        queue.Users[ind - 1] = queue.Users[ind];
                        queue.Users[ind] = temp;
                    }
                });

                queueUsers.appendChild(userDiv);
            }
            manageModal.style.display = "flex";
        });

        queueList.appendChild(queueCard);
    }
}

modalCloseButton.addEventListener("click", function(){
    manageModal.style.display = "none";
});

show_queue();