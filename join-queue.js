var listDiv = document.getElementById("service-list");
var waitText = document.getElementById("wait-time");
var joinBtn = document.getElementById("join-btn");
var leaveBtn = document.getElementById("leave-btn");
var message = document.getElementById("message");

var selectedService = null;

// build the services
function showServices() {
  listDiv.innerHTML = "";

  for (var i = 0; i < services.length; i++) {
    var s = services[i];
    var card = document.createElement("div");
    card.className = "service";
    card.setAttribute("data-id", s.id);
    card.innerHTML = "<h3>" + s.name + "</h3>" +
      "<p>" + s.peopleAhead + " people waiting</p>" +
      "<p>About " + getWaitTime(s) + " min</p>";

    card.addEventListener("click", function () {
      selectService(Number(this.getAttribute("data-id")));
    });

    listDiv.appendChild(card);
  }
}

function selectService(id) {
  // can't switch services while already in a queue
  if (getSavedQueue() !== null) {
    message.textContent = "Leave your current queue before picking another service.";
    return;
  }

  selectedService = findService(id);
  waitText.textContent = getWaitTime(selectedService) + " minutes";
  message.textContent = "";
  highlightSelected(id);
  updateButtons();
}

function highlightSelected(id) {
  var cards = document.querySelectorAll(".service");
  for (var i = 0; i < cards.length; i++) {
    if (Number(cards[i].getAttribute("data-id")) === id) {
      cards[i].classList.add("selected");
    } else {
      cards[i].classList.remove("selected");
    }
  }
}

function updateButtons() {
  var inQueue = getSavedQueue() !== null;
  joinBtn.disabled = inQueue || selectedService === null;
  leaveBtn.disabled = !inQueue;
}

joinBtn.addEventListener("click", function () {
  if (selectedService === null) {
    message.textContent = "Please select a service first.";
    return;
  }

  saveQueue({
    serviceId: selectedService.id,
    position: selectedService.peopleAhead + 1,
    joinedAt: Date.now()
  });

  message.textContent = "You joined the " + selectedService.name + " queue. Your position is #" +
    (selectedService.peopleAhead + 1) + ".";
  updateButtons();
});

leaveBtn.addEventListener("click", function () {
  clearQueue();
  selectedService = null;
  waitText.textContent = "Select a service";
  highlightSelected(-1);
  message.textContent = "You left the queue.";
  updateButtons();
});

// on page load, will restore if the user is already in a queue
showServices();
var existing = getSavedQueue();
if (existing !== null) {
  var svc = findService(existing.serviceId);
  selectedService = svc;
  highlightSelected(svc.id);
  waitText.textContent = getWaitTime(svc) + " minutes";
  message.textContent = "You're already in the " + svc.name + " queue.";
}
updateButtons();


