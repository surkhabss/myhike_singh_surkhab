import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { onAuthReady } from './authentication.js';
import { auth, db } from './firebaseConfig.js';
import { createHikeCard } from './components/hike-card.js';
import { sampleHikes } from './sampleHikes.js';

const container = document.getElementById('hikes-go-here');
const status = document.getElementById('hikes-status');
const nameLabel = document.getElementById('name-goes-here');
let stopQuote;

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

async function loadHikes() {
  const hikes = collection(db, 'hikes');
  const snapshot = await getDocs(hikes);
  if (!snapshot.empty) return snapshot;

  // Stable IDs avoid duplicates if two tabs seed at the same time.
  const batch = writeBatch(db);
  for (const hike of sampleHikes) {
    batch.set(doc(hikes, hike.code.toLowerCase()), { ...hike, last_updated: serverTimestamp() });
  }
  await batch.commit();
  return getDocs(hikes);
}

onAuthReady(async user => {
  stopQuote?.();
  container.replaceChildren();
  if (!user) {
    location.replace('login.html');
    return;
  }

  nameLabel.textContent = user.displayName || user.email || 'friend';
  status.textContent = 'Loading hikes…';
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  stopQuote = readQuote(day);

  try {
    const profile = (await getDoc(doc(db, 'users', user.uid))).data();
    if (auth.currentUser?.uid !== user.uid) return;
    if (profile?.name) nameLabel.textContent = profile.name;
    const favourites = profile?.favourites || [];
    const hikes = await loadHikes();
    if (auth.currentUser?.uid !== user.uid) return;
    hikes.forEach(hike => {
      container.append(createHikeCard(hike, user.uid, favourites.includes(hike.id)));
    });
    status.textContent = hikes.empty ? 'No hikes have been added yet.' : '';
  } catch (error) {
    if (auth.currentUser?.uid !== user.uid) return;
    console.error('Hikes:', error);
    status.textContent = 'The hikes could not be loaded. Please check your connection and try again.';
  }
});

window.addEventListener('pagehide', () => stopQuote?.());
