const form = document.getElementById('service_form');
const addServiceButton = document.getElementById('add_service_button');
const cancelButton = document.getElementById('cancel_button');
const formContainer = document.getElementById('service_form_container');
const formTitle = document.getElementById('form_title');
const submitButton = document.getElementById('submit_button');
const noServicesMessage = document.getElementById('no_services_message');

let editingServiceCard = null;


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

    deleteButton.addEventListener("click", function(){
        card.remove();
        updateNoServicesMessage();
    });
}

form.addEventListener("submit", function(event){
    event.preventDefault();
    
    const name = document.getElementById("service_name").value;
    const description = document.getElementById("service_description").value;
    const duration = document.getElementById("service_duration").value;
    const priority = document.getElementById("service_priority").value;

    if (editingServiceCard !== null){
        editingServiceCard.innerHTML = `
            <h3>${name}</h3>
            <p>${description}</p>
            <p> Expected Duration: ${duration} minutes</p>
            <p> Priority: ${priority}</p>
            <button class="edit_button">Edit</button>
            <button class="delete_button">Delete</button>
        `;

        cardEventListeners(editingServiceCard, name, description, duration, priority);

        editingServiceCard = null;
        form.reset();
        
        formTitle.textContent = "Add Service";
        submitButton.textContent = "Create Service";
        formContainer.style.display = "none";
        return;
    }
    console.log(name, description, duration, priority)

    const serviceList = document.getElementById("service_list");
    const serviceCard = document.createElement("div");

    serviceCard.className = "service_card";
    serviceCard.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
        <p> Expected Duration: ${duration} minutes</p>
        <p> Priority: ${priority}</p>
        <button class="edit_button">Edit</button>
        <button class="delete_button">Delete</button>
    `;

    cardEventListeners(serviceCard, name, description, duration, priority);


    serviceList.appendChild(serviceCard);
    updateNoServicesMessage();
    form.reset();
    formContainer.style.display = "none";
});

updateNoServicesMessage();
