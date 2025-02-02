import * as ExpoServerSDK from "expo-server-sdk";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";

import { User } from "./api";

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

const expo = new ExpoServerSDK.Expo();

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

async function hasNotificationBeenSent(
  userId: string,
  nonce: string
): Promise<boolean> {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("user_id", "==", userId),
      where("nonce", "==", nonce)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    logger.error("Error checking notification history:", {
      userId,
      nonce,
      error: (error as Error).message,
    });
    return false;
  }
}

async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string
) {
  if (!ExpoServerSDK.Expo.isExpoPushToken(pushToken)) {
    logger.error("Invalid Expo push token", { pushToken });
    return;
  }

  try {
    const messages = [
      {
        to: pushToken,
        sound: "default",
        title,
        body,
        priority: "high" as const,
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    logger.error("Error sending push notification:", {
      pushToken,
      error: (error as Error).message,
    });
  }
}

export async function createNotification(
  userId: string,
  title: string,
  content: string,
  nonce?: string
): Promise<boolean> {
  try {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      user_id: userId,
      title,
      content,
      status: "sent",
      nonce: nonce || uuidv4(),
      created_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    logger.error("Error creating notification:", {
      userId,
      error: (error as Error).message,
    });
    return false;
  }
}

export async function checkInactiveUsers(): Promise<void> {
  try {
    const usersRef = collection(db, "users");
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const snapshot = await getDocs(
      query(usersRef, where("last_updated", "<", oneMonthAgo.toISOString()))
    );

    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    const nonce = `check-in-${currentMonth.toLowerCase()}`;

    const inactiveUsers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    for (const inactiveUser of inactiveUsers) {
      const user = inactiveUser as User;
      // Check if notification was already sent this month
      const alreadySent = await hasNotificationBeenSent(
        user.clerk_user_id,
        nonce
      );
      if (alreadySent) {
        logger.info("Notification already sent this month", {
          userId: user.clerk_user_id,
          nonce,
        });
        continue;
      }

      // Create notification record
      await createNotification(
        user.clerk_user_id,
        "Hi from rabbitholers!",
        "We noticed you haven't checked in for a while - take a moment to open the app.",
        nonce
      );

      // Send push notification if user has push token
      if (user.expo_push_token) {
        await sendPushNotification(
          user.expo_push_token,
          "Time to Check In!",
          "We noticed you haven't checked in for a while - take a moment to open the app!"
        );
      }

      logger.info("Sent inactivity notification:", {
        userId: user.clerk_user_id,
        nonce,
      });
    }
  } catch (error) {
    logger.error("Error checking inactive users:", {
      error: (error as Error).message,
    });
  }
}
