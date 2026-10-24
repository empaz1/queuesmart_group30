
var listDiv = document.getElementById("service-list");
var waitText = document.getElementById("wait-time");
var joinBtn = document.getElementById("join-btn");
var leaveBtn = document.getElementById("leave-btn");
var message = document.getElementById("message");

var userName = "Guest";
var services = [];
var queues = [];
var selected = null;

function getUserId() {
  var id = localStorage.getItem("userId");
  if (id === null) {
    id = Math.floor(Math.random() * 90000) + 100;
    localStorage.setItem("userId", id);
  }
  return Number(id);
}

function getWaiting(serviceId) {
  var q = queues.find(function (q) {
    return q.serviceId === serviceId;
  });
  return q ? q.users.length : 0;
}

function getWait(service) {
  return getWaiting(service.id) * service.duration;
}

// refresh queue information
function refreshQueues() {
  return fetch("/api/queues")
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Could not load queues");
      }
      return res.json();
    })
    .then(function (data) {
      queues = data;
      showServices();

      if (selected !== null) {
        highlight(selected.id);
      }
    });
}

function showServices() {
  listDiv.innerHTML = "";
  services.forEach(function (s) {
    var card = document.createElement("div");
    card.className = "service";
    card.setAttribute("data-id", s.id);
    card.innerHTML = "<h3>" + s.name + "</h3>" +
      "<p>" + getWaiting(s.id) + " people waiting</p>" +
      "<p>About " + getWait(s) + " min</p>";
    card.addEventListener("click", function () {
      selectService(s);
    });
    listDiv.appendChild(card);
  });
}

function selectService(service) {
  if (getSavedQueue() !== null) {
    message.textContent = "Leave your current queue before picking another service.";
    return;
  }
  selected = service;
  waitText.textContent = getWait(service) + " minutes";
  message.textContent = "";
  highlight(service.id);
  updateButtons();
}

function highlight(id) {
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
  joinBtn.disabled = inQueue || selected === null;
  leaveBtn.disabled = !inQueue;
}

joinBtn.addEventListener("click", function () {
  if (selected === null) {
    message.textContent = "Please select a service first.";
    return;
  }

  joinBtn.disabled = true;

  fetch("/api/join-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: getUserId(),
      name: userName,
      serviceId: selected.id
    })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok) {
        message.textContent = result.data.error || "Could not join the queue.";
        return;
      }

      saveQueue({ serviceId: selected.id, userId: getUserId() });
      waitText.textContent = result.data.waitTime + " minutes";
      message.textContent = result.data.message + " Your position is #" + result.data.position + ".";

      refreshQueues().catch(function () {
        message.textContent += " Queue list could not refresh.";
      });
    })
    .catch(function () {
      message.textContent = "Could not reach the server.";
    })
    .finally(function () {
      updateButtons();
    });
});

leaveBtn.addEventListener("click", function () {
  var saved = getSavedQueue();
  if (saved === null) {
    return;
  }

  leaveBtn.disabled = true;

  fetch("/api/join-queue/" + saved.serviceId + "/users/" + saved.userId, {
    method: "DELETE"
  })
    .then(function (res) {
      // 404 means we're already out of the queue
      if (!res.ok && res.status !== 404) {
        message.textContent = "Could not leave the queue. Try again.";
        return;
      }

      clearQueue();
      selected = null;
      waitText.textContent = "Select a service";
      highlight(-1);
      message.textContent = "You left the queue.";

      refreshQueues().catch(function () {
        message.textContent += " Queue list could not refresh.";
      });
    })
    .catch(function () {
      message.textContent = "Could not reach the server.";
    })
    .finally(function () {
      updateButtons();
    });
});

Promise.all([
  fetch("/api/services").then(function (res) {
    if (!res.ok) {
      throw new Error("Could not load services");
    }
    return res.json();
  }),
  fetch("/api/queues").then(function (res) {
    if (!res.ok) {
      throw new Error("Could not load queues");
    }
    return res.json();
  })
])
  .then(function (results) {
    services = results[0];
    queues = results[1];
    showServices();

    var saved = getSavedQueue();
    if (saved !== null) {
      selected = services.find(function (s) {
        return s.id === saved.serviceId;
      });

      if (selected) {
        highlight(selected.id);
        message.textContent = "You're already in the " + selected.name + " queue.";

        fetch("/api/join-queue/" + saved.serviceId + "/users/" + saved.userId + "/status")
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            if (!data.error && data.position > 0) {
              waitText.textContent = data.waitTime + " minutes";
            } else {
              clearQueue();
              selected = null;
              waitText.textContent = "Select a service";
              highlight(-1);
              message.textContent = "You're no longer in that queue.";
              updateButtons();
            }
          })
          .catch(function () {
            message.textContent = "Could not load your queue status.";
          });
      }
    }

    updateButtons();
  })
  .catch(function () {
    message.textContent = "Could not load services.";
  });
