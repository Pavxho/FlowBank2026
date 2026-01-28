// firebase.js - Use this instead
// Load Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your config (keep this exactly as is)
const firebaseConfig = {
  apiKey: "AIzaSyDcq7cK1xOKAH4N-asS-1VukiJo5K6z3Ts",
  authDomain: "flowbank2026.firebaseapp.com",
  projectId: "flowbank2026",
  storageBucket: "flowbank2026.firebasestorage.app",
  messagingSenderId: "830628759184",
  appId: "1:830628759184:web:62e3ffc65d38bf67a2fa15",
  measurementId: "G-058WTSRPJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase connected!");

// Export for use in other files
export { db, auth };