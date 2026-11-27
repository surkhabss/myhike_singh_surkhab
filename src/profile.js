import { db } from "./firebaseConfig.js";
import { createHikeCard } from "./components/hike-card.js";
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
} from "firebase/firestore";

let currentUser = null;
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

async function displayFavourites(favourites, userId) {
  const container = document.getElementById("hikes-go-here");
  if (favourites.length === 0) {
    status.textContent = "No favourites yet. Tap a heart on the Hikes page.";
    return;
  }

  function removeCard(card) {
    card.remove();
    if (container.childElementCount === 0) {
      status.textContent = "No favourites yet. Tap a heart on the Hikes page.";
    }
  }

  const cards = document.createDocumentFragment();
  // Firestore accepts at most 30 IDs in each "in" query.
  for (let start = 0; start < favourites.length; start += 30) {
    const ids = favourites.slice(start, start + 30);
    const snapshot = await getDocs(query(collection(db, "hikes"), where(documentId(), "in", ids)));
    if (currentUser?.uid !== userId) return;
    snapshot.forEach(hike => cards.append(createHikeCard(hike, userId, true, removeCard)));
  }
  container.replaceChildren(cards);
  status.textContent = container.childElementCount ? "" : "Your favourite hikes could not be found.";
}

document.getElementById("profileForm").addEventListener("submit", saveProfile);
editBtn.addEventListener("click", enableEdit);

onAuthReady(async (user) => {
  currentUser = user;
  document.getElementById("hikes-go-here").replaceChildren();
  if (!user) {
    location.replace("login.html");
    return;
  }
  let favourites;
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (currentUser?.uid !== user.uid) return;
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
    await displayFavourites(favourites, user.uid);
  } catch (error) {
    console.error("Favourites:", error);
    status.textContent =
      "Your favourite hikes could not be loaded. Please refresh to try again.";
  }
});
