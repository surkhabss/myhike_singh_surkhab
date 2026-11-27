// Part of the COMP1800 Projects 1 Course (BCIT).
// Starter code provided for students to use and adapt.

import { auth, db } from "/src/firebaseConfig.js";
import { doc, setDoc } from 'firebase/firestore';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signupUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  try {
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name, email, country: 'Canada', school: 'BCIT',
    });
  } catch (error) {
    console.error('Profile creation:', error);
    alert('Your account was created, but your profile could not be saved. Please check Firestore permissions.');
  }
  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
  window.location.href = "index.html";
}

export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

export function authErrorMessage(error) {
  const code = (error?.code || "").toLowerCase();

  const map = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/email-already-in-use": "Email is already in use.",
    "auth/weak-password": "Password too weak (min 6 characters).",
    "auth/missing-password": "Password cannot be empty.",
    "auth/network-request-failed": "Network error. Try again.",
  };

  return map[code] || "Something went wrong. Please try again.";
}
