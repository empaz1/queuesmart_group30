// mock data
// (no backend for A2, so localStorage)

var services = [
  { id: 1, name: "Academic Advising", peopleAhead: 4, minutesPerPerson: 5 },
  { id: 2, name: "Financial Aid", peopleAhead: 7, minutesPerPerson: 8 },
  { id: 3, name: "IT Help Desk", peopleAhead: 2, minutesPerPerson: 6 },
  { id: 4, name: "Registrar Office", peopleAhead: 5, minutesPerPerson: 4 }
];

var STORAGE_KEY = "queuesmartUserQueue";

function getSavedQueue() {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    return null;
  }
  return JSON.parse(saved);
}

function saveQueue(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

function findService(id) {
  for (var i = 0; i < services.length; i++) {
    if (services[i].id === id) {
      return services[i];
    }
  }
  return null;
}

function getWaitTime(service) {
  // behind everyone currently in line, so +1 for turn 
  return (service.peopleAhead + 1) * service.minutesPerPerson;
}

