import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig.js';

const template = document.createElement('template');
template.innerHTML = `
  <div class="col">
    <article class="card h-100">
      <img class="card-img-top card-image" alt="">
      <button type="button" class="fav-btn btn btn-light position-absolute top-0 end-0 m-2" title="Favourite">
        <i class="bi text-danger fs-4" aria-hidden="true"></i>
      </button>
      <div class="card-body d-flex flex-column">
        <h3 class="card-title h5"></h3>
        <p class="card-text"></p>
        <p>Length: <span class="card-length"></span> km</p>
        <a class="btn btn-secondary read-more mt-auto">Read More</a>
      </div>
    </article>
  </div>`;

export function createHikeCard(hikeDoc, userId, saved, onRemove) {
  const hike = hikeDoc.data();
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector('.card-title').textContent = hike.name;
  card.querySelector('.card-text').textContent = hike.details || `Located in ${hike.city}.`;
  card.querySelector('.card-length').textContent = hike.length;
  card.querySelector('.read-more').href = `eachHike.html?docID=${encodeURIComponent(hikeDoc.id)}`;
  const image = card.querySelector('.card-image');
  image.alt = hike.name;
  if (hike.code) image.src = `/images/${encodeURIComponent(hike.code)}.jpg`;
  else image.hidden = true;

  const button = card.querySelector('.fav-btn');
  const heart = button.querySelector('i');
  button.setAttribute('aria-label', `Favourite ${hike.name}`);
  function showHeart() {
    heart.classList.toggle('bi-heart', !saved);
    heart.classList.toggle('bi-heart-fill', saved);
    button.setAttribute('aria-pressed', String(saved));
  }
  showHeart();

  button.addEventListener('click', async () => {
    if (button.disabled || auth.currentUser?.uid !== userId) return;
    button.disabled = true;
    const status = document.getElementById('hikes-status');
    try {
      await setDoc(doc(db, 'users', userId), {
        favourites: saved ? arrayRemove(hikeDoc.id) : arrayUnion(hikeDoc.id),
      }, { merge: true });
      if (!card.isConnected || auth.currentUser?.uid !== userId) return;
      saved = !saved;
      showHeart();
      status.textContent = '';
      if (!saved) onRemove?.(card);
    } catch (error) {
      if (card.isConnected && auth.currentUser?.uid === userId) {
        status.textContent = `Could not update favourites: ${error.code || error.message}`;
      }
    } finally {
      button.disabled = false;
    }
  });
  return card;
}
