
var emptyState = document.getElementById("empty-state");
var statusCard = document.getElementById("status-card");
var serviceName = document.getElementById("service-name");
var positionText = document.getElementById("position");
var waitText = document.getElementById("wait-time");
var badge = document.getElementById("status-badge");
var updatesList = document.getElementById("updates");
var leaveBtn = document.getElementById("leave-btn");

var saved = getSavedQueue();
var lastPosition = 0;
var timer = null;
var loading = false;

function addUpdate(text) {
  var li = document.createElement("li");
  li.textContent = new Date().toLocaleTimeString() + " - " + text;
  updatesList.insertBefore(li, updatesList.firstChild);
}

function showEmpty() {
  emptyState.style.display = "block";
  statusCard.style.display = "none";
}

function render(data, status) {
  emptyState.style.display = "none";
  statusCard.style.display = "block";

  serviceName.textContent = data.service;
  positionText.textContent = data.position > 0 ? "#" + data.position : "-";
  waitText.textContent = data.waitTime + " minutes";

  badge.textContent = status;
  badge.className = "badge";

  if (status === "Almost Ready") {
    badge.classList.add("almost");
  } else if (status === "Served") {
    badge.classList.add("served");
  }
}

function loadStatus() {
  if (loading || saved === null) {
    return;
  }

  loading = true;

  var url = "/api/join-queue/" + saved.serviceId + "/users/" + saved.userId + "/status";

  fetch(url)
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Could not load status");
      }
      return res.json();
    })
    .then(function (data) {
      if (data.position === 0) {
        clearQueue();
        clearInterval(timer);

        if (data.status === "Served") {
          addUpdate("You've been served. Thank you!");
          render(data, "Served");
        } else {
          addUpdate("You are no longer in the queue.");
          render(data, "Not in Queue");
        }

        leaveBtn.textContent = "Done";
        return;
      }

      if (data.position !== lastPosition) {
        if (lastPosition === 0) {
          addUpdate("You joined the " + data.service + " queue. Position #" + data.position + ".");
        } else if (data.position === 1) {
          addUpdate("You're next! Please get ready.");
        } else {
          addUpdate("Your position changed to #" + data.position + ".");
        }
      }

      render(data, data.status);
      lastPosition = data.position;
    })
    .catch(function () {
      addUpdate("Could not load your queue status. Please try again.");
      clearInterval(timer);
    })
    .finally(function () {
      loading = false;
    });
}

function goBack() {
  clearQueue();
  window.location.href = "join-queue.html";
}

leaveBtn.addEventListener("click", function () {
  if (leaveBtn.textContent === "Done") {
    goBack();
    return;
  }

  if (saved === null) {
    return;
  }

  clearInterval(timer);
  leaveBtn.disabled = true;

  fetch("/api/join-queue/" + saved.serviceId + "/users/" + saved.userId, {
    method: "DELETE"
  })
    .then(function (res) {
      if (res.ok || res.status === 404) {
        goBack();
      } else {
        addUpdate("Could not leave the queue. Try again.");
        leaveBtn.disabled = false;
        timer = setInterval(loadStatus, 3000);
      }
    })
    .catch(function () {
      addUpdate("Could not reach the server. Try again.");
      leaveBtn.disabled = false;
      timer = setInterval(loadStatus, 3000);
    });
});

if (saved === null) {
  showEmpty();
} else {
  loadStatus();
  timer = setInterval(loadStatus, 3000);
}
