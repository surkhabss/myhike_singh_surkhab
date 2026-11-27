import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  documentId,
  getDocs,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

let currentUser = null;
let favourites = [];
const fields = ["name", "country", "school", "bio"];
const profileStatus = document.getElementById("profile-status");
const status = document.getElementById("hikes-status");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

function showHeader(data) {
  const name = data.name || currentUser.displayName || "My profile";
  document.getElementById("profileName").textContent = name;
  document.getElementById("profileInitial").textContent = name
    .charAt(0)
    .toUpperCase();
  document.getElementById("profileEmail").textContent = currentUser.email || "";
}

function enableEdit() {
  fields.forEach((field) => {
    document.getElementById(field + "Input").disabled = false;
  });
  saveBtn.disabled = false;
  editBtn.disabled = true;
  profileStatus.textContent = "";
  document.getElementById("nameInput").focus();
}

async function saveProfile(event) {
  event.preventDefault();
  if (
    !currentUser ||
    saveBtn.disabled ||
    !document.getElementById("profileForm").reportValidity()
  )
    return;
  const updates = {};
  fields.forEach((field) => {
    updates[field] = document.getElementById(field + "Input").value.trim();
  });
  if (!updates.name) {
    profileStatus.textContent = "Please enter your name.";
    return;
  }
  saveBtn.disabled = true;
  profileStatus.textContent = "Saving profile…";
  try {
    await updateDoc(doc(db, "users", currentUser.uid), updates);
    fields.forEach((field) => {
      document.getElementById(field + "Input").disabled = true;
    });
    editBtn.disabled = false;
    showHeader(updates);
    profileStatus.textContent = "Profile saved!";
  } catch (error) {
    console.error("Save profile:", error);
    profileStatus.textContent =
      "Your profile could not be saved. Please try again.";
    saveBtn.disabled = false;
  }
}

async function displayFavourites() {
  const container = document.getElementById("hikes-go-here");
  container.replaceChildren();
  if (favourites.length === 0) {
    status.textContent = "No favourites yet. Tap a heart on the Hikes page.";
    return;
  }
  const q = query(
    collection(db, "hikes"),
    where(documentId(), "in", favourites),
  );
  const snapshot = await getDocs(q);
  snapshot.forEach((hikeDoc) => {
    const hike = hikeDoc.data();
    const card = document
      .getElementById("hikeCardTemplate")
      .content.cloneNode(true);
    card.querySelector(".card-title").textContent = hike.name;
    card.querySelector(".card-text").textContent =
      hike.details || `Located in ${hike.city}.`;
    card.querySelector(".card-length").textContent = hike.length;
    const image = card.querySelector(".card-image");
    if (hike.code) image.src = `/images/${encodeURIComponent(hike.code)}.jpg`;
    else image.hidden = true;
    image.alt = hike.name;
    card.querySelector(".read-more").href =
      `eachHike.html?docID=${encodeURIComponent(hikeDoc.id)}`;
    setupHeart(card, hikeDoc.id);
    container.appendChild(card);
  });
  status.textContent = snapshot.empty
    ? "Your favourite hikes could not be found."
    : "";
}

function setupHeart(card, hikeID) {
  const button = card.querySelector(".fav-btn");
  const heart = button.querySelector("i");
  const saved = favourites.includes(hikeID);
  heart.classList.toggle("bi-heart", !saved);
  heart.classList.toggle("bi-heart-fill", saved);
  button.setAttribute("aria-pressed", String(saved));
  button.setAttribute(
    "aria-label",
    `Favourite ${card.querySelector(".card-title").textContent}`,
  );
  button.addEventListener("click", () =>
    toggleFavourite(button, heart, hikeID),
  );
}

async function toggleFavourite(button, heart, hikeID) {
  if (!currentUser || button.disabled) return;
  button.disabled = true;
  const saved = heart.classList.contains("bi-heart-fill");
  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        favourites: saved ? arrayRemove(hikeID) : arrayUnion(hikeID),
      },
      { merge: true },
    );
    favourites = saved
      ? favourites.filter((id) => id !== hikeID)
      : [...favourites, hikeID];
    await displayFavourites();
  } catch (error) {
    status.textContent = `Could not update favourites: ${error.code || error.message}`;
  } finally {
    button.disabled = false;
  }
}

document.getElementById("profileForm").addEventListener("submit", saveProfile);
editBtn.addEventListener("click", enableEdit);

onAuthReady(async (user) => {
  currentUser = user;
  if (!user) {
    location.replace("login.html");
    return;
  }
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      profileStatus.textContent =
        "This account has no Firestore profile. Please use an account created through Sign up.";
      status.textContent = "";
      return;
    }
    const data = userDoc.data();
    fields.forEach((field) => {
      document.getElementById(field + "Input").value = data[field] || "";
    });
    showHeader(data);
    favourites = data.favourites || [];
    editBtn.disabled = false;
    profileStatus.textContent = "";
  } catch (error) {
    console.error("Load profile:", error);
    profileStatus.textContent =
      "Your profile could not be loaded. Please refresh to try again.";
    status.textContent = "";
    return;
  }
  try {
    await displayFavourites();
  } catch (error) {
    console.error("Favourites:", error);
    status.textContent =
      "Your favourite hikes could not be loaded. Please refresh to try again.";
  }
});
