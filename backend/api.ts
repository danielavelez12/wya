import { createClerkClient } from "@clerk/backend";
import { Request, Response } from "express";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  DocumentData,
  getDocs,
  getFirestore,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

require("dotenv").config();

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

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const cors = require("cors");
const express = require("express");

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
  blockedBy?: string[];
  blocked?: string[];
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
      blockedBy: [],
      blocked: [],
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

app.get("/api/privacy-policy", (_req: Request, res: Response) => {
  const privacyPolicy = `Privacy Policy for RabbitHolers

Last Updated: December 3, 2024

Introduction
Welcome to RabbitHolers. This privacy policy explains how we collect, use, and protect your personal information when you use our app.

Information We Collect
We collect the following types of information to provide and improve our service:

1. Contact Information
   - Name
   - Phone Number
   These are used for app functionality and are linked to your user identity.

2. Location Data
   - Precise Location
   This is used for app functionality and is linked to your user identity.

How We Use Your Information
We use the collected information for:
- Providing core app functionality
- Identifying and authenticating users
- Enabling location-based features

Data Storage and Security
- We implement appropriate security measures to protect your personal information
- Data is stored securely and accessed only when necessary for app functionality
- We retain your data only for as long as necessary to provide our services

Data Sharing and Disclosure
We do not sell your personal information. We may share your information only:
- When required by law
- To protect our rights or property
- With your explicit consent

Your Rights
You have the right to:
- Access your personal data
- Request correction of your data
- Request deletion of your data
- Withdraw consent for data collection

California Privacy Rights
Under California Civil Code Section 1798.83, California residents are entitled to specific rights regarding their personal information. You may contact us to exercise these rights.

Children's Privacy
Our service is not directed to children under 13. We do not knowingly collect information from children under 13.

Changes to This Privacy Policy
We may update this privacy policy periodically. Users will be notified of any material changes.

Contact Us
If you have questions about this Privacy Policy, please contact us at:
danielavelez1201@gmail.com

Consent
By using RabbitHolers, you consent to our collection and use of your information as described in this Privacy Policy.`;

  res.send(privacyPolicy);
});

app.delete("/api/users/:userId", async (req: Request, res: Response) => {
  try {
    // Delete from Clerk and get response
    const clerkResponse = await clerkClient.users.deleteUser(req.params.userId);
    console.log("Clerk deletion response:", clerkResponse);

    // Proceed with Firestore deletion only if Clerk deletion was successful
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    if (userQuery.empty) {
      res.status(404).json({ error: "User not found" });
    } else {
      const userDoc = userQuery.docs[0];
      await deleteDoc(userDoc.ref);
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.patch("/api/users/:userId/block", async (req: Request, res: Response) => {
  const { blockerID } = req.body;
  try {
    const usersRef = collection(db, "users");

    // Update blocked user's blockedBy array
    const blockedUserQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    // Update blocker's blocked array
    const blockerQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", blockerID))
    );

    if (blockedUserQuery.empty || blockerQuery.empty) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const blockedUserDoc = blockedUserQuery.docs[0];
    const blockerDoc = blockerQuery.docs[0];

    const batch = writeBatch(db);

    // Update blocked user's blockedBy array
    const blockedByArray = blockedUserDoc.data().blockedBy || [];
    if (!blockedByArray.includes(blockerID)) {
      batch.update(blockedUserDoc.ref, {
        blockedBy: [...blockedByArray, blockerID],
      });
    }

    // Update blocker's blocked array
    const blockedArray = blockerDoc.data().blocked || [];
    if (!blockedArray.includes(req.params.userId)) {
      batch.update(blockerDoc.ref, {
        blocked: [...blockedArray, req.params.userId],
      });
    }

    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
