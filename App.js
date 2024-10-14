import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  fetchUserById,
  updateLastLocation,
  updateShowLocation,
  updateUserAvatar,
} from "./src/api";
import SignInScreen from "./src/screens/Auth/sign-in";
import SignUpScreen from "./src/screens/Auth/sign-up";
import LocationDisabledScreen from "./src/screens/LocationDisabled";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createStackNavigator();

function AuthNavigator({ setUserId }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  console.log({ isLoaded, isSignedIn });

  const [location, setLocation] = useState(null);
  const [user, setUser] = useState(null);
  const Tab = createBottomTabNavigator();
  const [showLocation, setShowLocation] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const handleShowLocation = useCallback(
    async (value) => {
      console.log("handleShowLocation", value);
      setShowLocation(value);
      try {
        const success = await updateShowLocation(userId, value);
        if (!success) {
          console.error("Error updating show location:", success);
        }
      } catch (error) {
        console.error("Error updating show location:", error);
      }
    },
    [userId]
  );

  const handleUpdateAvatar = useCallback(
    async (avatarName) => {
      setAvatar(avatarName);
      console.log("handleUpdateAvatar", avatarName);
      try {
        await updateUserAvatar(userId, avatarName);
      } catch (error) {
        console.error("Error updating avatar:", error);
      }
    },
    [userId]
  );

  useEffect(() => {
    const initialize = async () => {
      if (isSignedIn) {
        setUserId(userId);
        // Fetch user data
        const userData = await fetchUserById(userId);
        setUser(userData);
        setShowLocation(userData.show_location);
        setAvatar(userData.avatar);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("App:  useEffect:  permission not granted");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      await updateLastLocation(
        userId,
        location.coords.latitude,
        location.coords.longitude
      );
    };

    initialize();
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

                  return <Ionicons name={iconName} size={size} color={color} />;
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
                options={{
                  tabBarIcon: ({ focused, color, size }) => {
                    const iconName = focused ? "map" : "map-outline";
                    return (
                      <Ionicons name={iconName} size={size} color={color} />
                    );
                  },
                }}
              >
                {() =>
                  showLocation ? (
                    <MapScreen
                      location={location}
                      avatar={avatar}
                      userId={userId}
                    />
                  ) : (
                    <LocationDisabledScreen
                      onEnableLocation={handleShowLocation}
                    />
                  )
                }
              </Tab.Screen>
              <Tab.Screen
                name="Profile"
                options={{
                  tabBarIcon: ({ focused, color, size }) => {
                    const iconName = focused
                      ? "person-circle"
                      : "person-circle-outline";
                    return (
                      <Ionicons name={iconName} size={size} color={color} />
                    );
                  },
                }}
              >
                {() => (
                  <ProfileScreen
                    showLocation={showLocation}
                    setShowLocation={handleShowLocation}
                    avatar={avatar}
                    setAvatar={handleUpdateAvatar}
                  />
                )}
              </Tab.Screen>
            </Tab.Navigator>
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
