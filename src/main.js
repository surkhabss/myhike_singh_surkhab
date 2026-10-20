import { onAuthReady } from './authentication.js';
import { db } from './firebaseConfig.js';
import { collection, doc, getDoc, getDocs, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import { sampleHikes } from './sampleHikes.js';

let stopQuote;
let activeUserId;
const status = document.getElementById('hikes-status');

// Runs immediately and again whenever today's quote changes in Firestore.
function readQuote(day) {
  return onSnapshot(doc(db, 'quotes', day), snapshot => {
    const quote = snapshot.exists() ? snapshot.data().quote : null;
    document.getElementById('quote-goes-here').textContent =
      typeof quote === 'string' ? quote : `No quote has been added for ${day} yet.`;
  }, error => {
    console.error('Quote listener:', error);
    document.getElementById('quote-goes-here').textContent = 'The quote could not be loaded. Please try again later.';
  });
}

async function showName(user) {
  let name = user.displayName || user.email || 'friend';
  try {
    const profile = await getDoc(doc(db, 'users', user.uid));
    if (profile.exists() && profile.data().name) name = profile.data().name;
  } catch (error) {
    console.error('Profile lookup:', error);
  }
  if (activeUserId === user.uid) document.getElementById('name-goes-here').textContent = name;
}

async function seedHikes() {
  const snapshot = await getDocs(collection(db, 'hikes'));
  if (!snapshot.empty) return;
  // Stable IDs avoid duplicates if two tabs seed at the same time.
  const batch = writeBatch(db);
  for (const hike of sampleHikes) {
    batch.set(doc(db, 'hikes', hike.code.toLowerCase()), { ...hike, last_updated: serverTimestamp() });
  }
  await batch.commit();
}

async function displayCardsDynamically() {
  const container = document.getElementById('hikes-go-here');
  const template = document.getElementById('hikeCardTemplate');
  const snapshot = await getDocs(collection(db, 'hikes'));
  container.replaceChildren();
  snapshot.forEach(hikeDoc => {
    const hike = hikeDoc.data();
    const card = template.content.cloneNode(true);
    card.querySelector('.card-title').textContent = hike.name;
    card.querySelector('.card-text').textContent = hike.details || `Located in ${hike.city}.`;
    card.querySelector('.card-length').textContent = hike.length;
    const image = card.querySelector('.card-image');
    image.src = `/images/${encodeURIComponent(hike.code)}.jpg`;
    image.alt = hike.name;
    card.querySelector('.read-more').href = `eachHike.html?docID=${encodeURIComponent(hikeDoc.id)}`;
    container.appendChild(card);
  });
  status.textContent = snapshot.empty ? 'No hikes have been added yet.' : '';
}

onAuthReady(async user => {
  stopQuote?.();
  activeUserId = user?.uid;
  if (!user) {
    location.replace('login.html');
    return;
  }
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  stopQuote = readQuote(day);
  await showName(user);
  try {
    await seedHikes();
    if (activeUserId !== user.uid) return;
    await displayCardsDynamically();
  } catch (error) {
    console.error('Hikes:', error);
    status.textContent = 'The hikes could not be loaded. Please check your connection and try again.';
  }
});

window.addEventListener('pagehide', () => stopQuote?.());
