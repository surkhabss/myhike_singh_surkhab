import { db } from './firebaseConfig.js';
import { onAuthReady } from './authentication.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

let currentUser = null;
const form = document.getElementById('addHikeForm');
const button = document.getElementById('saveHikeButton');
const status = document.getElementById('save-status');

onAuthReady(user => {
  currentUser = user;
  button.disabled = !user;
  if (!user) location.replace('index.html');
});

async function saveHike(event) {
  event.preventDefault();
  if (!currentUser || !form.reportValidity()) return;
  const name = document.getElementById('hikeNameInput').value.trim();
  const city = document.getElementById('cityInput').value.trim();
  if (!name || !city) {
    status.textContent = 'Enter a hike name and city.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Saving hike…';
  try {
    await addDoc(collection(db, 'hikes'), {
      name, city,
      level: document.getElementById('levelInput').value,
      length: Number(document.getElementById('lengthInput').value),
      details: document.getElementById('detailsInput').value.trim(),
      owner: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email,
      last_updated: serverTimestamp(),
    });
    location.href = 'main.html';
  } catch (error) {
    status.textContent = `Could not save hike: ${error.code || error.message}`;
    button.disabled = !currentUser;
  }
}

form.addEventListener('submit', saveHike);
