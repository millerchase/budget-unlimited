// create variable to hold db connection
let db;

// establish a connection
const request = indexedDB.open('budget_unlimited', 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;

  db.createObjectStore('new_budget', { autoIncrement: true });
};

// if successful, save reference to db in global variable
request.onsuccess = function (event) {
  db = event.target.result;

  // if app is online, upload data to api
  if (navigator.online) {
    uploadBudget();
  }
};

// if error, log error
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// if there is no internet connection, save data to indexedDB
function saveRecord(record) {
  const transaction = db.transaction(['new_budget'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget');
  budgetObjectStore.add(record);
}

// upload data to api
function uploadBudget() {
  const transaction = db.transaction(['new_budget'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget');

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if single record, send it to api
    if (getAll.result.length === 1) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_budget'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget');
          budgetObjectStore.clear();

          alert('Your budget has been updated!');
        })
        .catch(err => {
          console.log(err);
        });
      // if there are more than one record, send all data to api
    } else if (getAll.result.length > 1) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_budget'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget');
          budgetObjectStore.clear();

          alert('Your budget has been updated!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadBudget);
