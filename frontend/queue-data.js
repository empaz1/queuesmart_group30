
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
