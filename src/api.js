import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import app from "../ios/wya/firebaseConfig";

const db = getFirestore(app);

export async function fetchUsers() {
  console.log("fetchUsers:  starting");
  let querySnapshot = null;
  try {
    const docRef = collection(db, "users");
    querySnapshot = await getDocs(docRef);
  } catch (e) {
    console.error("fetchUsers: error fetching users: ", e);
  }
  console.log("fetchUsers:  got data");
  const usersList = [];
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    usersList.push({ id: doc.id, ...doc.data() });
  });
  console.log(usersList);
  return usersList;
}

export async function updateLastLocation(userID, lat, lon) {
  console.log("updateLastLocation:  starting: ", userID, lat, lon);
  try {
    const docRef = collection(db, "users");
    const userQuery = query(docRef, where("clerk_user_id", "==", userID));
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      console.log("updateLastLocation:  user not found");
      return false;
    } else {
      const userDoc = snapshot.docs[0];
      await updateDoc(userDoc.ref, {
        latitude: lat,
        longitude: lon,
        last_updated: new Date().toISOString(),
      });
      console.log("updateLastLocation:  done");
    }
  } catch (e) {
    console.error("updateLastLocation: error updating location: ", e);
  }
}

export async function loginOrSignup(phoneNumber) {
  console.log("loginOrSignup:  starting with phonenumber: ", phoneNumber);
  try {
    const docRef = collection(db, "users");
    const phoneNumberQuery = query(
      docRef,
      where("phone_number", "==", phoneNumber)
    );
    const snapshot = await getDocs(phoneNumberQuery);
    if (snapshot.empty) {
      console.log("loginOrSignup:  user not found, creating user");
      return false;
    } else {
      console.log("loginOrSignup:  user found");
      return { data: snapshot.docs[0].data(), id: snapshot.docs[0].id };
    }
  } catch (e) {
    console.error("loginOrSignup: error fetching user: ", e);
  }
}

export async function createUser(
  phoneNumber,
  firstName,
  lastName,
  email,
  clerkUserID
) {
  console.log("createUser:  starting");
  try {
    const res = await addDoc(collection(db, "users"), {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      clerk_user_id: clerkUserID,
    });
    console.log("createUser:  done");
    return res.id;
  } catch (e) {
    console.error("createUser: error creating user: ", e);
  }
}

export async function updateShowLocation(userID, showLocation) {
  console.log("updateShowLocation: starting:", userID, showLocation);
  try {
    const docRef = collection(db, "users");
    const userQuery = query(docRef, where("clerk_user_id", "==", userID));
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      console.log("updateShowLocation: user not found");
      return false;
    } else {
      console.log({ showLocation });
      const userDoc = snapshot.docs[0];
      await updateDoc(userDoc.ref, {
        show_location: showLocation,
      });
      console.log("updateShowLocation: done");
      return true;
    }
  } catch (e) {
    console.error("updateShowLocation: error updating show_location:", e);
    return false;
  }
}

export async function fetchUserById(userId) {
  console.log("fetchUserById: starting with userId:", userId);
  try {
    const docRef = collection(db, "users");
    const userQuery = query(docRef, where("clerk_user_id", "==", userId));
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      console.log("fetchUserById: user not found");
      return null;
    } else {
      const userDoc = snapshot.docs[0];
      console.log("fetchUserById: user found");
      return { id: userDoc.id, ...userDoc.data() };
    }
  } catch (e) {
    console.error("fetchUserById: error fetching user:", e);
    return null;
  }
}

export async function updateUserAvatar(userID, avatarName) {
  console.log("updateUserAvatar: starting:", userID, avatarName);
  try {
    const docRef = collection(db, "users");
    const userQuery = query(docRef, where("clerk_user_id", "==", userID));
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      console.log("updateUserAvatar: user not found");
      return false;
    } else {
      const userDoc = snapshot.docs[0];
      await updateDoc(userDoc.ref, {
        avatar: avatarName,
      });
      console.log("updateUserAvatar: done");
      return true;
    }
  } catch (e) {
    console.error("updateUserAvatar: error updating avatar:", e);
    return false;
  }
}
