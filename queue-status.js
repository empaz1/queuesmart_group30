var emptyState = document.getElementById("empty-state");
var statusCard = document.getElementById("status-card");
var serviceName = document.getElementById("service-name");
var positionText = document.getElementById("position");
var waitText = document.getElementById("wait-time");
var badge = document.getElementById("status-badge");
var updatesList = document.getElementById("updates");
var leaveBtn = document.getElementById("leave-btn");

var queue = getSavedQueue();
var service = null;
var timer = null;

function addUpdate(text) {
  var li = document.createElement("li");
  var time = new Date().toLocaleTimeString();
  li.textContent = time + " - " + text;
  updatesList.insertBefore(li, updatesList.firstChild); // newest on top
}

function getStatus(position) {
  if (position <= 0) {
    return "Served";
  } else if (position === 1) {
    return "Almost Ready";
  }
  return "Waiting";
}

function render() {
  serviceName.textContent = service.name;
  positionText.textContent = queue.position > 0 ? "#" + queue.position : "-";

  var status = getStatus(queue.position);
  badge.textContent = status;
  badge.className = "badge";
  if (status === "Almost Ready") {
    badge.classList.add("almost");
  } else if (status === "Served") {
    badge.classList.add("served");
  }

  if (queue.position > 0) {
    waitText.textContent = queue.position * service.minutesPerPerson + " minutes";
  } else {
    waitText.textContent = "0 minutes";
  }
}

// every few seconds someone ahead gets served
function tick() {
  queue.position = queue.position - 1;
  saveQueue(queue);
  render();

  if (queue.position === 1) {
    addUpdate("You're next! Please get ready.");
  } else if (queue.position <= 0) {
    addUpdate("You've been served. Thank you!");
    leaveBtn.textContent = "Done";
    clearInterval(timer);
  } else {
    addUpdate("Someone was served. You're now #" + queue.position + ".");
  }
}

leaveBtn.addEventListener("click", function () {
  clearInterval(timer);
  clearQueue();
  window.location.href = "join-queue.html";
});

// page setup
if (queue === null) {
  emptyState.style.display = "block";
  statusCard.style.display = "none";
} else {
  service = findService(queue.serviceId);
  emptyState.style.display = "none";
  statusCard.style.display = "block";

  render();
  addUpdate("You joined the " + service.name + " queue.");

  if (queue.position > 0) {
    timer = setInterval(tick, 4000);
  }
}
