var currentQueues = [
  { service: "Academic Advising", wait: "8 mins", date: "Oct 2, 2026 - 9:15 AM" },
];

var canceledQueues = [
  { service: "IT Student Helpdesk", started: "Oct 1, 2026 - 1:10 PM", canceled: "Oct 1, 2026 - 1:18 PM" },
];

var queueHistory = [
  { service: "Tuition Bill", totalWait: "24 mins", started: "Sep 20, 2026 - 2:00 PM", ended: "Sep 20, 2026 - 2:35 PM" }
];

var notifications = [
  { title: "Queue ready", msg: "Your spot for Academic Advising is now ready.", read: false },
  { title: "Queue update", msg: "The line for Financial Aid is moving faster. Wait adjusted to 15 mins.", read: false },
  { title: "Queue canceled", msg: "Your spot for IT Student Helpdesk was successfully canceled.", read: true }
];

var currentTab = "current";
var selectedQueueIndex = -1;
var selectedNotifIndex = -1;

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
      list.innerHTML = "<div class='empty-box'>No current queues.</div>";
      return;
    }

    for (var i = 0; i < currentQueues.length; i++) {
      var item = currentQueues[i];
      var posNumber = i + 1;

      list.innerHTML += 
        "<div class='card clickable' onclick='openQueueModal(" + i + ")'>" +
          "<div>" +
            "<div class='card-title'>" + item.service + "</div>" +
            "<div class='card-details'>" +
              "<span>Queue Number: <b>#" + posNumber + " of " + currentQueues.length + "</b></span>" +
              "<span>Est. Wait Time: <b>" + item.wait + "</b></span>" +
              "<span>Date Started: <b>" + item.date + "</b></span>" +
            "</div>" +
          "</div>" +
          "<div class='queue-number-box'>#" + posNumber + "</div>" +
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
            "<div class='card-title'>" + item.service + "</div>" +
            "<div class='card-details'>" +
              "<span>Date Started: <b>" + item.started + "</b></span>" +
              "<span>Date Canceled: <b>" + item.canceled + "</b></span>" +
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
            "<div class='card-title'>" + item.service + "</div>" +
            "<div class='card-details'>" +
              "<span>Total Wait: <b>" + item.totalWait + "</b></span>" +
              "<span>Started: <b>" + item.started + "</b></span>" +
              "<span>Ended: <b>" + item.ended + "</b></span>" +
            "</div>" +
          "</div>" +
          "<div class='tag tag-history'>Completed</div>" +
        "</div>";
    }
  }
}

function openQueueModal(index) {
  selectedQueueIndex = index;
  var queue = currentQueues[index];
  document.getElementById("qm-title").innerText = queue.service;
  document.getElementById("qm-text").innerText = 
    "You are in line for " + queue.service + ". Would you like to continue to wait or cancel your spot?";
  document.getElementById("queue-modal").classList.remove("hide");
}

function closeQueueModal() {
  document.getElementById("queue-modal").classList.add("hide");
}

function cancelSelectedQueue() {
  if (selectedQueueIndex > -1) {
    var canceledItem = currentQueues[selectedQueueIndex];

    currentQueues.splice(selectedQueueIndex, 1);

    canceledQueues.unshift({
      service: canceledItem.service,
      started: canceledItem.date,
      canceled: "Just now"
    });

    notifications.unshift({
      title: "Queue canceled",
      msg: "Your spot for " + canceledItem.service + " was canceled.",
      read: false
    });

    closeQueueModal();
    updateBadge();
    renderQueues();
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

function deleteNotif() {
  if (selectedNotifIndex > -1) {
    notifications.splice(selectedNotifIndex, 1);
    closeNotifModal();
    updateBadge();
    renderNotifications();
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
  } 
  else {
    badge.classList.remove("hide");
  }
}

renderQueues();
updateBadge();
