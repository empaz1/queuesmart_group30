const API_BASE = "http://localhost:3000/api";
const CURRENT_USER_ID = "u1";

var currentQueues = [];
var canceledQueues = [];
var queueHistory = [];
var notifications = [];

var currentTab = "current";
var selectedNotifIndex = -1;

async function loadAllBackendData() {
  await Promise.all([
    fetchActiveQueue(),
    fetchHistoryData(),
    fetchNotificationData()
  ]);
  renderQueues();
  updateBadge();
}

async function fetchActiveQueue() {
  try {
    const res = await fetch(`${API_BASE}/queue/user/${CURRENT_USER_ID}`);
    const data = await res.json();
    currentQueues = [];
    if (data.active) {
      currentQueues.push({
        ticket: data.ticket,
        service: data.service,
        wait: `${data.estimatedWaitMinutes} mins`,
        position: data.position,
        date: "Today"
      });
    }
  } catch (err) {
    console.error("Error fetching active queue:", err);
  }
}

async function fetchHistoryData() {
  try {
    const res = await fetch(`${API_BASE}/history/${CURRENT_USER_ID}`);
    const data = await res.json();
    canceledQueues = [];
    queueHistory = [];

    data.forEach(item => {
      if (item.status === "Cancelled") {
        canceledQueues.push({
          ticket: item.ticket,
          service: item.service,
          started: item.date,
          canceled: "Cancelled"
        });
      } else {
        queueHistory.push({
          ticket: item.ticket,
          service: item.service,
          totalWait: "Completed",
          started: item.date,
          ended: item.date
        });
      }
    });
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

async function fetchNotificationData() {
  try {
    const res = await fetch(`${API_BASE}/notifications/${CURRENT_USER_ID}`);
    const data = await res.json();
    notifications = data.map(n => ({
      id: n.id,
      title: n.title,
      msg: n.text,
      read: false
    }));
  } catch (err) {
    console.error("Error loading notifications:", err);
  }
}

function showPage(pageName) {
  document.getElementById("page-dashboard").classList.add("hide");
  document.getElementById("page-notifications").classList.add("hide");
  document.getElementById("page-service").classList.add("hide");

  document.getElementById("nav-dash").classList.remove("active");
  document.getElementById("nav-service").classList.remove("active");
  document.getElementById("nav-notif").classList.remove("active");

  if (pageName === "dashboard") {
    document.getElementById("page-dashboard").classList.remove("hide");
    document.getElementById("nav-dash").classList.add("active");
    renderQueues();
  } else if (pageName === "notifications") {
    document.getElementById("page-notifications").classList.remove("hide");
    document.getElementById("nav-notif").classList.add("active");
    renderNotifications();
  } else if (pageName === "service") {
    document.getElementById("page-service").classList.remove("hide");
    document.getElementById("nav-service").classList.add("active");
  }
}

function changeQueueTab(tabName) {
  currentTab = tabName;

  document.getElementById("tab-current").classList.remove("active");
  document.getElementById("tab-canceled").classList.remove("active");
  document.getElementById("tab-history").classList.remove("active");

  if (tabName === "current") {
    document.getElementById("tab-current").classList.add("active");
  } else if (tabName === "canceled") {
    document.getElementById("tab-canceled").classList.add("active");
  } else if (tabName === "history") {
    document.getElementById("tab-history").classList.add("active");
  }

  renderQueues();
}

function renderQueues() {
  var list = document.getElementById("queue-list");
  list.innerHTML = "";

  if (currentTab === "current") {
    if (currentQueues.length === 0) {
      list.innerHTML = `
        <div class='empty-box'>
          <p style="margin-bottom: 12px;">You are not currently in any queue.</p>
          <button class="btn btn-red" onclick="joinAcademicAdvisingQueue()">Join Academic Advising Line</button>
        </div>`;
      return;
    }

    for (var i = 0; i < currentQueues.length; i++) {
      var item = currentQueues[i];
      list.innerHTML += 
        "<div class='card clickable' onclick='openQueueModal()'>" +
          "<div>" +
            "<div class='card-title'>" + item.service + " (" + item.ticket + ")</div>" +
            "<div class='card-details'>" +
              "<span>Position: <b>#" + item.position + "</b></span>" +
              "<span>Est. Wait Time: <b>" + item.wait + "</b></span>" +
            "</div>" +
          "</div>" +
          "<div class='queue-number-box'>#" + item.position + "</div>" +
        "</div>";
    }
  }

  if (currentTab === "canceled") {
    if (canceledQueues.length === 0) {
      list.innerHTML = "<div class='empty-box'>No canceled queues.</div>";
      return;
    }

    for (var i = 0; i < canceledQueues.length; i++) {
      var item = canceledQueues[i];
      list.innerHTML += 
        "<div class='card'>" +
          "<div>" +
            "<div class='card-title'>" + item.service + " (" + item.ticket + ")</div>" +
            "<div class='card-details'>" +
              "<span>Date: <b>" + item.started + "</b></span>" +
            "</div>" +
          "</div>" +
          "<div class='tag tag-canceled'>Canceled</div>" +
        "</div>";
    }
  }

  if (currentTab === "history") {
    if (queueHistory.length === 0) {
      list.innerHTML = "<div class='empty-box'>No history found.</div>";
      return;
    }

    for (var i = 0; i < queueHistory.length; i++) {
      var item = queueHistory[i];
      list.innerHTML += 
        "<div class='card'>" +
          "<div>" +
            "<div class='card-title'>" + item.service + " (" + item.ticket + ")</div>" +
            "<div class='card-details'>" +
              "<span>Date: <b>" + item.started + "</b></span>" +
            "</div>" +
          "</div>" +
          "<div class='tag tag-history'>Completed</div>" +
        "</div>";
    }
  }
}

function openQueueModal() {
  if (currentQueues.length === 0) return;
  var queue = currentQueues[0];
  document.getElementById("qm-title").innerText = queue.service;
  document.getElementById("qm-text").innerText = 
    "You are holding ticket " + queue.ticket + ". Would you like to stay in line or cancel your spot?";
  document.getElementById("queue-modal").classList.remove("hide");
}

function closeQueueModal() {
  document.getElementById("queue-modal").classList.add("hide");
}

async function cancelSelectedQueue() {
  try {
    const res = await fetch(`${API_BASE}/queue/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: CURRENT_USER_ID })
    });

    if (res.ok) {
      closeQueueModal();
      await loadAllBackendData();
    }
  } catch (err) {
    console.error("Failed to cancel queue:", err);
  }
}

async function joinAcademicAdvisingQueue() {
  try {
    const res = await fetch(`${API_BASE}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: CURRENT_USER_ID, serviceId: "s1" })
    });

    if (res.ok) {
      await loadAllBackendData();
    }
  } catch (err) {
    console.error("Failed to join queue:", err);
  }
}

function renderNotifications() {
  var list = document.getElementById("notif-list");
  list.innerHTML = "";

  if (notifications.length === 0) {
    list.innerHTML = "<div class='empty-box'>No notifications.</div>";
    return;
  }

  for (var i = 0; i < notifications.length; i++) {
    var notif = notifications[i];
    var unreadClass = notif.read ? "" : "unread";
    var statusText = notif.read ? "Read" : "Unread";
    var statusClass = notif.read ? "status-read" : "status-unread";

    list.innerHTML += 
      "<div class='notif-card " + unreadClass + "' onclick='openNotifModal(" + i + ")'>" +
        "<div class='notif-top'>" +
          "<div class='notif-title'>" + notif.title + "</div>" +
        "</div>" +
        "<div class='notif-msg'>" + notif.msg + "</div>" +
        "<div class='notif-status " + statusClass + "'>" + statusText + "</div>" +
      "</div>";
  }
}

function openNotifModal(index) {
  selectedNotifIndex = index;
  var notif = notifications[index];
  notif.read = true;
  updateBadge();
  renderNotifications();

  document.getElementById("nm-title").innerText = notif.title;
  document.getElementById("nm-msg").innerText = notif.msg;
  document.getElementById("notif-modal").classList.remove("hide");
}

function closeNotifModal() {
  document.getElementById("notif-modal").classList.add("hide");
}

async function deleteNotif() {
  try {
    await fetch(`${API_BASE}/notifications/${CURRENT_USER_ID}`, { method: "DELETE" });
    notifications = [];
    closeNotifModal();
    updateBadge();
    renderNotifications();
  } catch (err) {
    console.error("Failed to delete notifications:", err);
  }
}

function markUnread() {
  if (selectedNotifIndex > -1) {
    notifications[selectedNotifIndex].read = false;
    closeNotifModal();
    updateBadge();
    renderNotifications();
  }
}

function updateBadge() {
  var count = 0;
  for (var i = 0; i < notifications.length; i++) {
    if (!notifications[i].read) {
      count++;
    }
  }

  var badge = document.getElementById("badge");
  badge.innerText = count;
  if (count === 0) {
    badge.classList.add("hide");
  } else {
    badge.classList.remove("hide");
  }
}

//loadAllBackendData();
document.addEventListener("DOMContentLoaded", () => {
  loadAllBackendData();
});
