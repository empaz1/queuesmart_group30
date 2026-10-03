const services = ["Academic Advising", "Financial Aid", "IT Help Desk"];
const students = [
  ["Student 1", "student1@example.com", services[0], "Degree planning", 1, 12],
  ["Student 2", "student2@example.com", services[0], "Course selection", 1, 20],
  ["Student 3", "student3@example.com", services[0], "Graduation planning", 2, 29],
  ["Student 4", "student4@example.com", services[0], "Academic standing", 1, 37],
  ["Student 5", "student5@example.com", services[1], "Aid application", 1, 10],
  ["Student 6", "student6@example.com", services[1], "FAFSA review", 1, 18],
  ["Student 7", "student7@example.com", services[1], "Scholarship status", 1, 26],
  ["Student 8", "student8@example.com", services[2], "Account access", 1, 8],
  ["Student 9", "student9@example.com", services[2], "Laptop support", 1, 16],
].map(([name, email, service, appointment, party, wait], index) => ({
  id: index + 1, name, email, service, appointment, party, wait,
  phone: "123-456-7890", checkIn: `${9}:${String(index * 6 + 5).padStart(2, "0")} AM`,
}));
const queues = Object.fromEntries(services.map((name, index) => [name, {
  open: true, paused: false, serving: null, completed: 0,
  priority: index === 0 ? "High" : "Normal", duration: [45, 30, 20][index],
  waiting: students.filter((person) => person.service === name),
}]));
const $ = (selector) => document.querySelector(selector);
let service = services[0], editing = null, cancelling = null;

function cell(label, value) {
  const element = document.createElement("td");
  element.dataset.label = label;
  if (value instanceof Node) {
    element.append(value);
  } else {
    element.textContent = value;
  }
  return element;
}

function actionButton(label, attribute, id, variant = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `table-action ${variant}`.trim();
  button.dataset[attribute] = id;
  button.textContent = label;
  return button;
}

function log(message) {
  $("#dashboard-notice").textContent = message;
}

function renderQueue() {
  const queue = queues[service];
  const body = $("#manage-queue-list");

  $("#service-select").value = service;
  $("#total-people").textContent = queue.waiting.length;
  $("#queue-status").textContent = queue.open ? "Open" : "Closed";
  $("#flow-status").textContent = queue.paused ? "Paused" : "Active";
  $("#queue-count-label").textContent = `${queue.waiting.length} waiting`;
  $("#queue-message").textContent = `${queue.open ? "Open" : "Closed"} to arrivals · ${queue.paused ? "Flow paused" : "Flow active"}`;
  $("#toggle-arrivals").textContent = queue.open ? "Close to arrivals" : "Open to arrivals";
  $("#toggle-flow").textContent = queue.paused ? "Resume flow" : "Pause flow";
  $("#toggle-flow").setAttribute("aria-pressed", queue.paused);
  $("#call-next").disabled = queue.paused || !!queue.serving || !queue.waiting.length;
  $("#now-serving").hidden = !queue.serving;
  if (queue.serving) {
    $("#serving-name").textContent = `${queue.serving.name} · ${queue.serving.appointment}`;
  }

  body.replaceChildren();
  queue.waiting.forEach((person, index) => {
    const row = document.createElement("tr");
    const info = document.createElement("div");
    info.className = "customer-identity";
    [person.name, person.email, person.phone].forEach((text, index) => {
      const item = document.createElement(index === 0 ? "strong" : "span");
      item.textContent = text;
      info.append(item);
    });

    const appointment = document.createElement("div");
    appointment.className = "appointment-details";
    appointment.textContent = `${person.appointment} · Checked in ${person.checkIn}`;

    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      actionButton("Edit wait", "edit", person.id),
      actionButton("Cancel", "cancel", person.id, "is-danger"),
    );

    row.append(
      cell("Pos", index + 1),
      cell("Customer", info),
      cell("Appointment", appointment),
      cell("Est. wait", `${person.wait} min`),
      cell("Actions", actions),
    );
    body.append(row);
  });

  if (queue.waiting.length === 0) {
    const row = document.createElement("tr");
    const emptyCell = cell("Queue", "No customers are waiting.");
    emptyCell.colSpan = 5;
    emptyCell.className = "empty-queue";
    row.append(emptyCell);
    body.append(row);
  }
}

function renderViews() {
  const cards = $("#admin-queue-list");
  cards.replaceChildren();

  services.forEach((name) => {
    const queue = queues[name];
    const card = document.createElement("button");
    const title = document.createElement("strong");
    title.textContent = name;

    const priority = document.createElement("span");
    priority.textContent = `Priority: ${queue.priority}`;

    const duration = document.createElement("span");
    duration.textContent = `Expected duration: ${queue.duration} minutes`;

    const manage = document.createElement("span");
    manage.className = "button button-primary";
    manage.textContent = "Manage Queue";

    card.type = "button";
    card.className = "service-card";
    card.dataset.service = name;
    card.append(title, priority, duration, manage);
    cards.append(card);
  });
}

function render() {
  renderQueue();
  renderViews();
}

function showPage(page) {
  ["dashboard", "queues"].forEach((name) => {
    $(`#page-${name}`).classList.toggle("hide", name !== page);
    const button = $(`#nav-${name === "dashboard" ? "dash" : name}`);
    button.classList.toggle("active", name === page);
    if (name === page) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

$(".nav-menu").addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (button) showPage(button.dataset.page);
});

$("#back-to-services").addEventListener("click", () => showPage("dashboard"));
$("#service-select").addEventListener("change", (event) => {
  service = event.target.value;
  renderQueue();
});

$("#toggle-arrivals").addEventListener("click", () => {
  queues[service].open = !queues[service].open;
  log(`${service} ${queues[service].open ? "opened" : "closed"} to arrivals.`);
  render();
});

$("#toggle-flow").addEventListener("click", () => {
  queues[service].paused = !queues[service].paused;
  log(`${service} flow ${queues[service].paused ? "paused" : "resumed"}.`);
  render();
});

$("#call-next").addEventListener("click", () => {
  const queue = queues[service];
  if (queue.paused || queue.serving || queue.waiting.length === 0) return;
  queue.serving = queue.waiting.shift();
  log(`Now serving ${queue.serving.name}.`);
  render();
});

$("#finish-service").addEventListener("click", () => {
  const queue = queues[service];
  if (!queue.serving) return;
  log(`${queue.serving.name}'s appointment is complete.`);
  queue.serving = null;
  queue.completed++;
  render();
});

$("#manage-queue-list").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const cancelButton = event.target.closest("[data-cancel]");

  if (editButton) {
    editing = queues[service].waiting.find((person) => person.id === Number(editButton.dataset.edit));
    if (!editing) return;
    $("#etm-customer-name").textContent = editing.name;
    $("#new-wait-time").value = editing.wait;
    $("#edit-time-modal").classList.remove("hide");
  }

  if (cancelButton) {
    cancelling = Number(cancelButton.dataset.cancel);
    const person = queues[service].waiting.find((item) => item.id === cancelling);
    if (!person) return;
    $("#cancel-customer-name").textContent = person.name;
    $("#cancel-modal").classList.remove("hide");
  }
});

$("#wait-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editing || !event.currentTarget.reportValidity()) return;
  editing.wait = Number($("#new-wait-time").value);
  log(`${editing.name}'s wait updated to ${editing.wait} minutes.`);
  $("#edit-time-modal").classList.add("hide");
  render();
});

$("#close-edit-modal").addEventListener("click", () => $("#edit-time-modal").classList.add("hide"));
$("#close-cancel-modal").addEventListener("click", () => $("#cancel-modal").classList.add("hide"));

$("#confirm-cancel").addEventListener("click", () => {
  const queue = queues[service];
  queue.waiting = queue.waiting.filter((person) => person.id !== cancelling);
  const person = students.find((item) => item.id === cancelling);
  if (person) {
    log(`${person.name}'s appointment was cancelled.`);
    students.splice(students.indexOf(person), 1);
  }
  $("#cancel-modal").classList.add("hide");
  render();
});

$("#admin-queue-list").addEventListener("click", (event) => {
  const card = event.target.closest("[data-service]");
  if (!card) return;
  service = card.dataset.service;
  render();
  showPage("queues");
});

render();