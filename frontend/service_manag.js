const form = document.getElementById('service_form');
const addServiceButton = document.getElementById('add_service_button');
const cancelButton = document.getElementById('cancel_button');
const formContainer = document.getElementById('service_form_container');
const formTitle = document.getElementById('form_title');
const submitButton = document.getElementById('submit_button');
const noServicesMessage = document.getElementById('no_services_message');

let editingServiceCard = null;

async function fetchServices(){
    try{
        const response = await fetch('/api/services');
        if(!response.ok){
            throw new Error('Failed to fetch services');
        }

        const serv = await response.json();

        const serviceList = document.getElementById("service_list");
        serviceList.innerHTML = "";

        serv.forEach(services => {
            createServiceCard(services);
        });

        updateNoServicesMessage();
    }

    
    catch(error){
        console.error('Error: ', error);
    }
}

addServiceButton.addEventListener("click", function(){
    editingServiceCard = null;
    form.reset();
    formTitle.textContent = "Add Service";
    submitButton.textContent = "Create Service";
    formContainer.style.display = "block";
});

cancelButton.addEventListener("click", function(){
    form.reset();
    editingServiceCard = null;
    formTitle.textContent = "Add Service";
    submitButton.textContent = "Create Service";
    formContainer.style.display = "none";
});

function updateNoServicesMessage() {
    const serviceCards = document.querySelectorAll(".service_card");
    if (serviceCards.length === 0) {
        noServicesMessage.style.display = "block";
    }
    else {
        noServicesMessage.style.display = "none";
    }
}

function createServiceCard(service) {
    const serviceList = document.getElementById("service_list");
    const serviceCard = document.createElement("div");
    serviceCard.className = "service_card";
    serviceCard.dataset.id = service.id;;

    serviceCard.innerHTML = `
        <h3>${service.name}</h3>
        <p>${service.description}</p>
        <p>Expected Duration: ${service.duration} minutes</p>
        <p>Priority: ${service.priority}</p>
        <button class="edit_button">Edit</button>
        <button class="delete_button">Delete</button>
    `;

    cardEventListeners(
        serviceCard,
        service.name,
        service.description,
        service.duration,
        service.priority
    );

    serviceList.appendChild(serviceCard);
    updateNoServicesMessage();
}

function cardEventListeners(card, name, description, duration, priority){
    const editButton = card.querySelector(".edit_button");
    const deleteButton = card.querySelector(".delete_button");
    
    editButton.addEventListener("click", function(){
        editingServiceCard = card;
        document.getElementById("service_name").value = name;
        document.getElementById("service_description").value = description;
        document.getElementById("service_duration").value = duration;
        document.getElementById("service_priority").value = priority;

        formTitle.textContent = "Edit Service";
        submitButton.textContent = "Save Changes";

        formContainer.style.display = "block";
    });

    deleteButton.addEventListener("click", async function(){
        const id = card.dataset.id;
        try{
            const response = await fetch(`/api/services/${id}`, {
                method: "DELETE"
            });

            if(!response.ok){
                throw new Error("Failed to delete");
            }
            await fetchServices();
        }
        catch(error){
            console.error("Error deleting service: ", error);
            alert("Unable to connect to the server");
        }
        
    });
}

form.addEventListener("submit", async function(event){
    event.preventDefault();
    
    const name = document.getElementById("service_name").value;
    const description = document.getElementById("service_description").value;
    const duration = Number(document.getElementById("service_duration").value);
    const priority = document.getElementById("service_priority").value;

    if (editingServiceCard !== null){
        const serviceId = editingServiceCard.dataset.id;

        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    description,
                    duration,
                    priority
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.error || "Failed to update service");
                return;
            }

            await fetchServices();

            editingServiceCard = null;
            form.reset();
            formTitle.textContent = "Add Service";
            submitButton.textContent = "Create Service";
            formContainer.style.display = "none";
            
        }
        catch (error) {
            console.error("Unable to update service: ", error);
            alert("Unable to connect to the server");
        }
        return;
    }
    
    
    try {
        const response = await fetch("/api/services", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                description,
                duration,
                priority
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "Failed to create service");
            return;
        }

        await fetchServices();

        form.reset();
        formContainer.style.display = "none";

    } 

    catch (error) {
    console.error("Error creating service:", error);
    alert("Unable to connect to the server");
}

});

updateNoServicesMessage();
fetchServices();