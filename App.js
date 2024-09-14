import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import React, { useEffect, useState, useCallback } from "react";
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

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MapScreen from "./src/screens/MapScreen";

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

const Stack = createStackNavigator();

export default function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [showName, setShowName] = useState(false);
  const [userID, setUserID] = useState(null);

  const [location, setLocation] = useState(null);
  console.log("App:  starting");

  const [fadeAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  const submitPhoneNumber = useCallback(
    async (phoneNumber) => {
      setLoading(true);
      console.log("submitPhoneNumber:  starting");
      const data = await loginOrSignup(phoneNumber);
      setLoading(false);
      if (!data) {
        setShowSignup(true);
        setNewPhoneNumber(phoneNumber);
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
    },
    [fadeIn, floatUp]
  );

  const signup = useCallback(async () => {
    console.log("signup:  starting");
    setLoading(true);
    const newUserID = await createUser(newPhoneNumber, firstName, lastName);
    setUserID(newUserID);
    setLoading(false);
    console.log("signup:  done");
    setShowName(true);
    floatUp(-250);
    fadeIn();
  }, [newPhoneNumber, firstName, lastName, floatUp, fadeIn]);

  const fadeIn = useCallback(() => {
    console.log("fadeIn:  starting");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [fadeAnim]);

  const floatUp = useCallback(
    (to) => {
      console.log("floatUp:  starting");
      Animated.timing(floatAnim, {
        toValue: to,
        duration: 500, // Duration in milliseconds
        useNativeDriver: true, // Use native driver for better performance
      }).start();
    },
    [floatAnim]
  );

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
    }
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
        location.coords.longitude
      );
    })();
  }, [userID]);

  const ControlledInput = React.memo(({ style, onSubmit, ...props }) => {
    const [value, setValue] = useState("");

    const handleChangeText = useCallback((text) => {
      setValue(text);
    }, []);

    const handleSubmitEditing = useCallback(() => {
      onSubmit(value);
    }, [value, onSubmit]);

    return (
      <TextInput
        {...props}
        style={style}
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
      />
    );
  });

  const HomeScreen = React.memo(() => (
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
                  <ControlledInput
                    style={styles.nameInput}
                    placeholder="First name"
                    placeholderTextColor="gray"
                    onSubmit={handleFirstNameSubmit}
                  />
                  <ControlledInput
                    style={styles.nameInput}
                    placeholder="Last name"
                    placeholderTextColor="gray"
                    onSubmit={handleLastNameSubmit}
                    returnKeyType="done"
                  />
                </Animated.View>
              ) : (
                <ControlledInput
                  style={styles.phoneInput}
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                  placeholderTextColor="gray"
                  onSubmit={handlePhoneSubmit}
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
  ));

  const handlePhoneSubmit = useCallback(
    (value) => {
      submitPhoneNumber(value);
    },
    [submitPhoneNumber]
  );

  const handleFirstNameSubmit = useCallback((value) => {
    setFirstName(value);
  }, []);

  const handleLastNameSubmit = useCallback(
    (value) => {
      setLastName(value);
      signup();
    },
    [signup]
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {location ? (
          <Stack.Screen
            name="Map"
            component={MapScreen}
            initialParams={{ location }}
          />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
