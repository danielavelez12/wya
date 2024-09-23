import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { updateLastLocation } from "./src/api";
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

const Stack = createStackNavigator();

function AuthNavigator({ setUserId }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  console.log({ isLoaded, isSignedIn });

  const [location, setLocation] = useState(null);
  const Tab = createBottomTabNavigator();

  useEffect(() => {
    (async () => {
      if (isSignedIn) {
        setUserId(userId);
      }
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
  }, [isSignedIn, setUserId, userId]);

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
  const [userId, setUserId] = useState(null);

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

  TaskManager.defineTask(
    "fetch_location",
    async ({ data: { locations }, error }) => {
      if (!userId) return;
      if (error) {
        console.error("fetch_location:  error: ", error);
        return;
      }
      const { latitude, longitude } = locations[0].coords;
      try {
        console.log("fetch_location:  location: ", latitude, longitude);
        await updateLastLocation(userId, latitude, longitude);
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
          <AuthNavigator setUserId={setUserId} />
        </NavigationContainer>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
