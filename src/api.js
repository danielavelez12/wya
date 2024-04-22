import {
  getDocs,
  collection,
  doc,
  where,
  addDoc,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

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
    const docRef = doc(db, "users", userID);
    if (docRef.empty) {
      console.log("updateLastLocation:  user not found");
      return false;
    } else {
      await updateDoc(docRef, {
        latitude: lat,
        longitude: lon,
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
      where("phone_number", "==", phoneNumber),
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

export async function createUser(phoneNumber, firstName, lastName) {
  console.log("createUser:  starting");
  try {
    const res = await addDoc(collection(db, "users"), {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
    });
    console.log("createUser:  done");
    return res.id;
  } catch (e) {
    console.error("createUser: error creating user: ", e);
  }
}
