import { Request, Response } from "express";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  DocumentData,
  getDocs,
  getFirestore,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "wya-app-530d5.firebaseapp.com",
  projectId: "wya-app-530d5",
  storageBucket: "wya-app-530d5.appspot.com",
  messagingSenderId: "663230930206",
  appId: "1:663230930206:web:8954c9da3ca0c6ea8d3d0f",
  measurementId: "G-TW3P6945TN",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const cors = require("cors");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

interface User {
  id?: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  clerk_user_id: string;
  latitude?: number;
  longitude?: number;
  last_updated?: string;
  show_location?: boolean;
  show_city?: boolean;
  avatar?: string;
}

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const users: User[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      users.push({ id: doc.id, ...(doc.data() as Omit<User, "id">) });
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users/location", async (req: Request, res: Response) => {
  const { userID, lat, lon } = req.body;
  console.log(userID, lat, lon);
  try {
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", userID))
    );

    if (userQuery.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userQuery.docs[0];
    await updateDoc(userDoc.ref, {
      latitude: lat,
      longitude: lon,
      last_updated: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

app.post("/api/users/signup", async (req: Request, res: Response) => {
  const { phoneNumber, firstName, lastName, email, clerkUserID } = req.body;
  try {
    const usersRef = collection(db, "users");
    const newUser = await addDoc(usersRef, {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      clerk_user_id: clerkUserID,
    });
    res.json({ id: newUser.id });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get(
  "/api/users/phone/:phoneNumber",
  async (req: Request, res: Response) => {
    try {
      const usersRef = collection(db, "users");
      const userQuery = await getDocs(
        query(usersRef, where("phone_number", "==", req.params.phoneNumber))
      );

      if (userQuery.empty) {
        res.json({ exists: false });
      } else {
        const userDoc = userQuery.docs[0];
        res.json({
          exists: true,
          data: userDoc.data(),
          id: userDoc.id,
        });
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      res.status(500).json({ error: "Failed to check phone number" });
    }
  }
);

app.get("/api/users/:userId", async (req: Request, res: Response) => {
  console.log("calling by user id, ", req.params.userId);
  try {
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    if (userQuery.empty) {
      res.status(404).json({ error: "User not found" });
    } else {
      const userDoc = userQuery.docs[0];
      res.json({ id: userDoc.id, ...userDoc.data() });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.patch(
  "/api/users/:userId/show-location",
  async (req: Request, res: Response) => {
    const { showLocation } = req.body;
    try {
      const usersRef = collection(db, "users");
      const userQuery = await getDocs(
        query(usersRef, where("clerk_user_id", "==", req.params.userId))
      );

      if (userQuery.empty) {
        res.status(404).json({ error: "User not found" });
      } else {
        const userDoc = userQuery.docs[0];
        await updateDoc(userDoc.ref, {
          show_location: showLocation,
        });
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error updating show location:", error);
      res.status(500).json({ error: "Failed to update show location" });
    }
  }
);

app.patch("/api/users/:userId/avatar", async (req: Request, res: Response) => {
  const { avatarName } = req.body;
  try {
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    if (userQuery.empty) {
      res.status(404).json({ error: "User not found" });
    } else {
      const userDoc = userQuery.docs[0];
      await updateDoc(userDoc.ref, {
        avatar: avatarName,
      });
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ error: "Failed to update avatar" });
  }
});

app.patch(
  "/api/users/:userId/show-city",
  async (req: Request, res: Response) => {
    const { showCity } = req.body;
    try {
      const usersRef = collection(db, "users");
      const userQuery = await getDocs(
        query(usersRef, where("clerk_user_id", "==", req.params.userId))
      );

      if (userQuery.empty) {
        res.status(404).json({ error: "User not found" });
      } else {
        const userDoc = userQuery.docs[0];
        await updateDoc(userDoc.ref, {
          show_city: showCity,
        });
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error updating show city:", error);
      res.status(500).json({ error: "Failed to update show city" });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
