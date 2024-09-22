import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { createUser, loginOrSignup, updateLastLocation } from "./src/api";
import SignInScreen from "./src/screens/Auth/sign-in";
import SignUpScreen from "./src/screens/Auth/sign-up";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

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

function AuthNavigator() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  console.log({ isLoaded, isSignedIn });

  const [location, setLocation] = useState(null);
  const Tab = createBottomTabNavigator();

  useEffect(() => {
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
        userId,
        location.coords.latitude,
        location.coords.longitude
      );
    })();
  }, [userId]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isSignedIn ? (
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <Stack.Screen name="Main">
          {() => (
            <>
              {location && (
                <Tab.Navigator
                  screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                      let iconName;

                      if (route.name === "Map") {
                        iconName = focused ? "map" : "map-outline";
                      } else if (route.name === "Profile") {
                        iconName = focused
                          ? "person-circle"
                          : "person-circle-outline";
                      }

                      return (
                        <Ionicons name={iconName} size={size} color={color} />
                      );
                    },
                    tabBarActiveTintColor: "#8B4513",
                    tabBarInactiveTintColor: "#A0522D",
                    tabBarStyle: {
                      backgroundColor: "#FFF8DC",
                    },
                    headerStyle: {
                      backgroundColor: "#FFF8DC",
                    },
                    headerTintColor: "#8B4513",
                  })}
                >
                  <Tab.Screen
                    name="Map"
                    component={MapScreen}
                    initialParams={{ location }}
                  />
                  <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    initialParams={{ location }}
                  />
                </Tab.Navigator>
              )}
            </>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
    );
  }
  console.log("Clerk Publishable Key:", publishableKey);

  const [showSignup, setShowSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [showName, setShowName] = useState(false);
  const [userID, setUserID] = useState(null);

  const location = null;
  console.log("App:  starting");

  const [fadeAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  const tokenCache = {
    async getToken(key) {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
          console.log(`${key} was used 🔐 \n`);
        } else {
          console.log("No values stored under key: " + key);
        }
        return item;
      } catch (error) {
        console.error("SecureStore get item error: ", error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    async saveToken(key, value) {
      try {
        await SecureStore.setItemAsync(key, value);
        console.log(`Token saved under key: ${key}`);
      } catch (error) {
        console.error("SecureStore set item error: ", error);
      }
    },
  };

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

  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  if (!isNavigationReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <StatusBar style="dark" />
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
