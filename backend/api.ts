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
import winston from "winston";

import { checkInactiveUsers } from "./notifications";

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

export interface User {
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
  blocked_by?: string[];
  blocked?: string[];
  expo_push_token: string;
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

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
    const err = error as Error;
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users/location", async (req: Request, res: Response) => {
  const { userID, lat, lon } = req.body;
  logger.info("Location update attempt", { userID, lat, lon });
  try {
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", userID))
    );

    if (userQuery.empty) {
      logger.warn("Location update failed - user not found", { userID });
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userQuery.docs[0];
    await updateDoc(userDoc.ref, {
      latitude: lat,
      longitude: lon,
      last_updated: new Date().toISOString(),
    });

    logger.info("Location successfully updated", { userID, lat, lon });
    res.json({ success: true });
  } catch (error) {
    const err = error as Error;
    logger.error("Error updating location", {
      userID,
      error: err.message,
    });
    res.status(500).json({ error: "Failed to update location" });
  }
});

app.post("/api/users/signup", async (req: Request, res: Response) => {
  const { phoneNumber, firstName, lastName, email, clerkUserID } = req.body;
  logger.info("User signup attempt", {
    clerkUserID,
    email,
    firstName,
    lastName,
  });
  try {
    const usersRef = collection(db, "users");
    const newUser = await addDoc(usersRef, {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      clerk_user_id: clerkUserID,
      blocked_by: [],
      blocked: [],
    });
    logger.info("User successfully created", {
      userId: newUser.id,
      clerkUserID,
    });
    res.json({ id: newUser.id });
  } catch (error) {
    const err = error as Error;
    logger.error("Error creating user", {
      clerkUserID,
      error: err.message,
    });
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get(
  "/api/users/phone/:phoneNumber",
  async (req: Request, res: Response) => {
    logger.info("Phone number lookup attempt", {
      phoneNumber: req.params.phoneNumber,
    });
    try {
      const usersRef = collection(db, "users");
      const userQuery = await getDocs(
        query(usersRef, where("phone_number", "==", req.params.phoneNumber))
      );

      if (userQuery.empty) {
        logger.info("Phone number not found", {
          phoneNumber: req.params.phoneNumber,
        });
        res.json({ exists: false });
      } else {
        logger.info("Phone number found", {
          phoneNumber: req.params.phoneNumber,
        });
        const userDoc = userQuery.docs[0];
        res.json({
          exists: true,
          data: userDoc.data(),
          id: userDoc.id,
        });
      }
    } catch (error) {
      const err = error as Error;
      logger.error("Error checking phone number", {
        phoneNumber: req.params.phoneNumber,
        error: err.message,
      });
      res.status(500).json({ error: "Failed to check phone number" });
    }
  }
);

app.get("/api/users/:userId", async (req: Request, res: Response) => {
  logger.info("User fetch attempt", { userId: req.params.userId });
  try {
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    if (userQuery.empty) {
      logger.warn("User not found", { userId: req.params.userId });
      res.status(404).json({ error: "User not found" });
    } else {
      const userDoc = userQuery.docs[0];
      logger.info("User successfully fetched", { userId: req.params.userId });
      res.json({ id: userDoc.id, ...userDoc.data() });
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Error fetching user", {
      userId: req.params.userId,
      error: err.message,
    });
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.patch(
  "/api/users/:userId/show-location",
  async (req: Request, res: Response) => {
    const { showLocation } = req.body;
    logger.info("Show location update attempt", {
      userId: req.params.userId,
      showLocation,
    });
    try {
      const usersRef = collection(db, "users");
      const userQuery = await getDocs(
        query(usersRef, where("clerk_user_id", "==", req.params.userId))
      );

      if (userQuery.empty) {
        logger.warn("Show location update failed - user not found", {
          userId: req.params.userId,
        });
        res.status(404).json({ error: "User not found" });
      } else {
        const userDoc = userQuery.docs[0];
        await updateDoc(userDoc.ref, {
          show_location: showLocation,
        });
        logger.info("Show location successfully updated", {
          userId: req.params.userId,
          showLocation,
        });
        res.json({ success: true });
      }
    } catch (error) {
      const err = error as Error;
      logger.error("Error updating show location", {
        userId: req.params.userId,
        error: err.message,
      });
      res.status(500).json({ error: "Failed to update show location" });
    }
  }
);

app.patch("/api/users/:userId/avatar", async (req: Request, res: Response) => {
  const { avatarName } = req.body;
  logger.info("Avatar update attempt", {
    userId: req.params.userId,
    avatarName,
  });
  try {
    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    if (userQuery.empty) {
      logger.warn("Avatar update failed - user not found", {
        userId: req.params.userId,
      });
      res.status(404).json({ error: "User not found" });
    } else {
      const userDoc = userQuery.docs[0];
      await updateDoc(userDoc.ref, {
        avatar: avatarName,
      });
      logger.info("Avatar successfully updated", {
        userId: req.params.userId,
        avatarName,
      });
      res.json({ success: true });
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Error updating avatar", {
      userId: req.params.userId,
      error: err.message,
    });
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
      const err = error as Error;
      console.error("Error updating show city:", err.message);
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
   These are used for app functionality only and are linked to your user identity. These are not shared with any third parties.

2. Location Data
   - Precise Location
   This is used for app functionality only and is linked to your user identity. This is not shared with any third parties.

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
  logger.info("User deletion attempt", { userId: req.params.userId });
  try {
    const clerkResponse = await clerkClient.users.deleteUser(req.params.userId);
    logger.info("Clerk user deletion successful", {
      userId: req.params.userId,
      clerkResponse,
    });

    const usersRef = collection(db, "users");
    const userQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );

    if (userQuery.empty) {
      logger.warn("Firestore user not found for deletion", {
        userId: req.params.userId,
      });
      res.status(404).json({ error: "User not found" });
    } else {
      const userDoc = userQuery.docs[0];
      await deleteDoc(userDoc.ref);
      logger.info("User successfully deleted from Firestore", {
        userId: req.params.userId,
      });
      res.json({ success: true });
    }
  } catch (error) {
    const err = error as Error;
    logger.error("Error deleting user", {
      userId: req.params.userId,
      error: err.message,
    });
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.patch("/api/users/:userId/block", async (req: Request, res: Response) => {
  const { blockerID } = req.body;
  logger.info("Block user attempt", {
    blockedUserId: req.params.userId,
    blockerID,
  });
  try {
    const usersRef = collection(db, "users");
    const blockedUserQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", req.params.userId))
    );
    const blockerQuery = await getDocs(
      query(usersRef, where("clerk_user_id", "==", blockerID))
    );

    if (blockedUserQuery.empty || blockerQuery.empty) {
      logger.warn("Block failed - user not found", {
        blockedUserId: req.params.userId,
        blockerID,
      });
      res.status(404).json({ error: "User not found" });
      return;
    }

    const blockedUserDoc = blockedUserQuery.docs[0];
    const blockerDoc = blockerQuery.docs[0];
    const batch = writeBatch(db);

    const blockedByArray = blockedUserDoc.data().blockedBy || [];
    const blockedArray = blockerDoc.data().blocked || [];

    if (!blockedByArray.includes(blockerID)) {
      batch.update(blockedUserDoc.ref, {
        blockedBy: [...blockedByArray, blockerID],
      });
    }

    if (!blockedArray.includes(req.params.userId)) {
      batch.update(blockerDoc.ref, {
        blocked: [...blockedArray, req.params.userId],
      });
    }

    await batch.commit();
    logger.info("User successfully blocked", {
      blockedUserId: req.params.userId,
      blockerID,
    });
    res.json({ success: true });
  } catch (error) {
    const err = error as Error;
    logger.error("Error blocking user", {
      blockedUserId: req.params.userId,
      blockerID,
      error: err.message,
    });
    res.status(500).json({ error: "Failed to block user" });
  }
});

app.post("/api/reports", async (req: Request, res: Response) => {
  const { reporterID, reportedID, explanation, timestamp } = req.body;
  logger.info("Report submission attempt", {
    reporterID,
    reportedID,
    explanation,
  });
  try {
    const reportsRef = collection(db, "reports");
    const newReport = await addDoc(reportsRef, {
      reporter_id: reporterID,
      reported_id: reportedID,
      explanation,
      timestamp,
      status: "pending",
    });
    logger.info("Report successfully submitted", {
      reportId: newReport.id,
      reporterID,
      reportedID,
    });
    res.json({ id: newReport.id });
  } catch (error) {
    const err = error as Error;
    logger.error("Error creating report", {
      reporterID,
      reportedID,
      error: err.message,
    });
    res.status(500).json({ error: "Failed to create report" });
  }
});

// Daily cron job endpoint to check for inactive users
app.post(
  "/api/cron/check-inactive-users",
  async (req: Request, res: Response) => {
    try {
      await checkInactiveUsers();
      logger.info("Successfully ran inactive users check");
      res.json({ success: true });
    } catch (error) {
      logger.error("Error running inactive users check:", {
        error: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to check inactive users" });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
