import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBj3ijKchN-dfjO9muvsD00JxDAX3zu7VQ",
  authDomain: "gym-dashboard-32691.firebaseapp.com",
  projectId: "gym-dashboard-32691",
  storageBucket: "gym-dashboard-32691.firebasestorage.app",
  messagingSenderId: "347784402290",
  appId: "1:347784402290:web:133bbd2aee0487a29f39eb",
  measurementId: "G-NKKV9Y2MJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 