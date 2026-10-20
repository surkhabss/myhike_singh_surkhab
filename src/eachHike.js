import { db } from './firebaseConfig.js';
import { onAuthReady } from './authentication.js';
import { doc, getDoc } from 'firebase/firestore';

const hikeId = new URL(location.href).searchParams.get('docID');
const heading = document.getElementById('hikeName');
const image = document.getElementById('hikeImage');

onAuthReady(async user => {
  if (!user) {
    location.replace('login.html');
    return;
  }
  if (!hikeId || hikeId.includes('/')) {
    heading.textContent = 'Choose a hike from the dashboard.';
    return;
  }
  try {
    const snapshot = await getDoc(doc(db, 'hikes', hikeId));
    if (!snapshot.exists()) {
      heading.textContent = 'This hike could not be found.';
      return;
    }
    const hike = snapshot.data();
    heading.textContent = hike.name;
    image.src = `/images/${encodeURIComponent(hike.code)}.jpg`;
    image.alt = `${hike.name} image`;
    image.hidden = false;
    document.getElementById('hikeDetails').textContent = hike.details || '';
  } catch (error) {
    console.error('Hike details:', error);
    heading.textContent = 'The hike could not be loaded. Please try again.';
  }
});
