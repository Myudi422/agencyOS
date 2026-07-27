import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDiCCYSZVMSKMjkpx7QYZvUSxGYr-bQSdc",
  authDomain: "shiera-fb0f2.firebaseapp.com",
  projectId: "shiera-fb0f2",
  storageBucket: "shiera-fb0f2.appspot.com",
  messagingSenderId: "151082575783",
  appId: "1:151082575783:web:53a37edfc1cf3a8f8c7882",
  measurementId: "G-YBDMGT80J7",
};

// Prevent re-initialization on hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
