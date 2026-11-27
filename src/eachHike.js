import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

const hikeId = new URL(location.href).searchParams.get("docID");
const heading = document.getElementById("hikeName");
const image = document.getElementById("hikeImage");
let currentUser = null;
let hikeLoaded = false;
const reviewForm = document.getElementById("reviewForm");
const reviewSubmit = document.getElementById("reviewSubmit");
const reviewStatus = document.getElementById("review-status");

async function displayReviews() {
  const status = document.getElementById("reviews-status");
  const container = document.getElementById("reviews-go-here");
  try {
    const q = query(
      collection(db, "reviews"),
      where("hikeDocID", "==", hikeId),
      orderBy("timestamp", "desc"),
      limit(5),
    );
    const snapshot = await getDocs(q);
    container.replaceChildren();
    snapshot.forEach((reviewDoc) => {
      const review = reviewDoc.data();
      const card = document
        .getElementById("reviewTemplate")
        .content.cloneNode(true);
      const date = review.timestamp
        ? review.timestamp.toDate().toLocaleDateString()
        : "just now";
      card.querySelector(".review-title").textContent =
        `${review.title} ${"★".repeat(review.rating)}`;
      card.querySelector(".review-meta").textContent =
        `${review.userName} · ${date}`;
      card.querySelector(".review-text").textContent = review.text;
      container.appendChild(card);
    });
    status.textContent = snapshot.empty
      ? "No reviews yet. Be the first to write one!"
      : "Newest first · Up to 5 reviews";
  } catch (error) {
    console.error("Reviews:", error);
    status.textContent =
      error.code === "failed-precondition"
        ? "Reviews need a Firestore index. Open the link in the browser console, create the index, then refresh."
        : "Reviews could not be loaded. Please try again.";
  }
}

async function submitReview(event) {
  event.preventDefault();
  if (
    !currentUser ||
    !hikeLoaded ||
    reviewSubmit.disabled ||
    !reviewForm.reportValidity()
  )
    return;
  const title = document.getElementById("reviewTitle").value.trim();
  const text = document.getElementById("reviewText").value.trim();
  const rating = Number(document.getElementById("reviewRating").value);
  if (
    !title ||
    !text ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    reviewStatus.textContent =
      "Enter a title, a review, and a rating from 1 to 5.";
    return;
  }
  reviewSubmit.disabled = true;
  reviewStatus.textContent = "Saving review…";
  try {
    await addDoc(collection(db, "reviews"), {
      hikeDocID: hikeId,
      userID: currentUser.uid,
      userName: currentUser.displayName || currentUser.email,
      title,
      rating,
      text,
      timestamp: serverTimestamp(),
    });
    reviewForm.reset();
    reviewStatus.textContent = "Review submitted!";
    await displayReviews();
  } catch (error) {
    console.error("Submit review:", error);
    reviewStatus.textContent =
      "Your review could not be saved. Please try again.";
  } finally {
    reviewSubmit.disabled = !currentUser || !hikeLoaded;
  }
}

reviewForm.addEventListener("submit", submitReview);

onAuthReady(async (user) => {
  currentUser = user;
  if (!user) {
    location.replace("login.html");
    return;
  }
  if (!hikeId || hikeId.includes("/")) {
    heading.textContent = "Choose a hike from the dashboard.";
    return;
  }
  try {
    const hikeRef = doc(db, "hikes", hikeId);
    const snapshot = await getDoc(hikeRef);
    if (!snapshot.exists()) {
      heading.textContent = "This hike could not be found.";
      return;
    }
    const hike = snapshot.data();
    heading.textContent = hike.name;
    if (hike.code) image.src = `/images/${encodeURIComponent(hike.code)}.jpg`;
    image.alt = `${hike.name} image`;
    image.hidden = !hike.code;
    await updateDoc(hikeRef, { views: increment(1) });
    document.getElementById("viewCount").textContent = (hike.views || 0) + 1;
    document.getElementById("hikeDetails").textContent = hike.details || "";
    hikeLoaded = true;
    reviewSubmit.disabled = false;
  } catch (error) {
    console.error("Hike details:", error);
    heading.textContent = "The hike could not be loaded. Please try again.";
  }
  if (hikeLoaded) await displayReviews();
});
