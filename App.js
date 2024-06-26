import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Animated,
  ActivityIndicator,
} from "react-native";

import {
  fetchUsers,
  loginOrSignup,
  createUser,
  updateLastLocation,
} from "./src/api";

const styles = {
  title: {
    fontSize: 64,
    fontWeight: "bold",
    margin: 24,
  },
  home: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 24,
    textAlign: "center",
  },
  header: {
    maxHeight: 150,
    flex: 1,
    alignItems: "center",
  },
  phoneInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    width: "80%", // Adjust width as needed
  },
  nameInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    height: 40,
    marginVertical: 10,
    padding: 10,
    width: "100%", // Adjust width as needed
  },
  nameInputContainer: {
    width: "80%",
  },
  locationContainer: {
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  subText: {
    fontSize: 12,
    color: "gray",
  },
};

const timestampToDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showName, setShowName] = useState(false);
  const [userID, setUserID] = useState(null);

  const [location, setLocation] = useState(null);
  console.log("App:  starting");

  const [fadeAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  const submitPhoneNumber = async () => {
    setLoading(true);
    console.log("submitPhoneNumber:  starting");
    const data = await loginOrSignup(phoneNumber);
    setLoading(false);
    if (!data) {
      setShowSignup(true);
      fadeIn();
      floatUp(-50);
    } else {
      console.log(data);
      setFirstName(data.data.first_name);
      setLastName(data.data.last_name);
      setShowName(true);
      floatUp(-250);
      setUserID(data.id);
      fadeIn();
    }
    console.log("submitPhoneNumber:  done");
  };
  const signup = async () => {
    console.log("signup:  starting");
    setLoading(true);
    const newUserID = await createUser(phoneNumber, firstName, lastName);
    setUserID(newUserID);
    setLoading(false);
    console.log("signup:  done");
    setShowName(true);
    floatUp(-250);
    fadeIn();
  };

  const fadeIn = () => {
    console.log("fadeIn:  starting");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  };

  const floatUp = (to) => {
    console.log("floatUp:  starting");
    Animated.timing(floatAnim, {
      toValue: to,
      duration: 500, // Duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  };

  TaskManager.defineTask(
    "fetch_location",
    async ({ data: { locations }, error }) => {
      if (!userID) return;
      if (error) {
        console.error("fetch_location:  error: ", error);
        return;
      }
      const { latitude, longitude } = locations[0].coords;
      try {
        console.log("fetch_location:  location: ", latitude, longitude);
        await updateLastLocation(userID, latitude, longitude);
      } catch (e) {
        console.error("fetch_location:  error: ", e);
      }
    },
  );

  Location.startLocationUpdatesAsync("fetch_location", {
    accuracy: Location.Accuracy.Highest,
    distanceInterval: 1,
    deferredUpdatesInterval: 1000,
    foregroundService: {
      notificationTitle: "wya",
      notificationBody: "wya is using your location",
    },
  });

  Location.hasStartedLocationUpdatesAsync("fetch_location").then((res) => {
    console.log("hasStartedLocationUpdatesAsync:  ", res);
    if (res) {
      console.log("hasStartedLocationUpdatesAsync:  stopping");
      Location.stopLocationUpdatesAsync("fetch_location");
    }
  });

  useEffect(() => {
    if (!userID) return;
    (async () => {
      console.log("App:  useEffect starting");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("App:  useEffect:  permission not granted");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      console.log("App:  useEffect:  location: ", location);
      await updateLastLocation(
        userID,
        location.coords.latitude,
        location.coords.longitude,
      );
    })();
  }, [phoneNumber, userID]);

  return (
    <View style={styles.home}>
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: floatAnim }],
          },
        ]}
      >
        <Text style={styles.title}>wya</Text>
        {showName && <Text style={styles.greeting}>👋 hi, {firstName}!</Text>}
      </Animated.View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          {!showName && (
            <>
              {showSignup ? (
                <Animated.View
                  style={[
                    styles.nameInputContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: floatAnim }],
                    },
                  ]}
                >
                  <TextInput
                    style={styles.nameInput}
                    placeholder="First name"
                    placeholderTextColor="gray"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Last name"
                    placeholderTextColor="gray"
                    value={lastName}
                    onChangeText={setLastName}
                    onSubmitEditing={signup}
                  />
                </Animated.View>
              ) : (
                <TextInput
                  style={styles.phoneInput}
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                  placeholderTextColor="gray"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onSubmitEditing={submitPhoneNumber}
                  returnKeyType="done"
                />
              )}
            </>
          )}
          {location && (
            <>
              <Animated.View
                style={[
                  styles.locationContainer,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <Animated.Text
                  style={{
                    opacity: fadeAnim,
                  }}
                >
                  📍 {location.coords.latitude}, {location.coords.longitude}
                </Animated.Text>
              </Animated.View>
              <Animated.Text
                style={[
                  styles.subText,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                Last updated: {timestampToDate(location.timestamp)}
              </Animated.Text>
            </>
          )}
        </>
      )}
    </View>
  );
}
