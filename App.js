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
  updateLastLocation,
  updateShowCity,
  updateShowLocation,
  updateUserAvatar,
} from "./src/api";
import { UserProvider, useUsers } from "./src/context/UserContext";
import SignInScreen from "./src/screens/Auth/sign-in";
import SignUpScreen from "./src/screens/Auth/sign-up";
import ContactListScreen from "./src/screens/ContactList";
import LocationDisabledScreen from "./src/screens/LocationDisabled";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createStackNavigator();

function AuthNavigator({ setUserId }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { updateUserPreference, currentUser, initializeCurrentUser } =
    useUsers();
  const [isLoading, setIsLoading] = useState(true);

  const [location, setLocation] = useState(null);
  const Tab = createBottomTabNavigator();

  const handleShowLocation = useCallback(
    async (value) => {
      try {
        await updateShowLocation(userId, value);
        updateUserPreference(userId, "show_location", value);
      } catch (error) {
        console.error("Error updating show location:", error);
      }
    },
    [userId, updateUserPreference]
  );

  const handleUpdateAvatar = useCallback(
    async (avatarName) => {
      try {
        await updateUserAvatar(userId, avatarName);
        updateUserPreference(userId, "avatar", avatarName);
      } catch (error) {
        console.error("Error updating avatar:", error);
      }
    },
    [userId, updateUserPreference]
  );

  const handleShowCity = useCallback(
    async (value) => {
      try {
        await updateShowCity(userId, value);
        updateUserPreference(userId, "show_city", value);
      } catch (error) {
        console.error("Error updating show city:", error);
      }
    },
    [userId, updateUserPreference]
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        if (isSignedIn) {
          setUserId(userId);
          const userData = await initializeCurrentUser(userId);

          if (userData?.show_location) {
            await updateLastLocation(
              userId,
              location.coords.latitude,
              location.coords.longitude
            );
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, setUserId, userId]);

  if (!isLoaded || isLoading) {
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
                  currentUser?.show_location ? (
                    <MapScreen
                      location={location}
                      avatar={currentUser?.avatar}
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
                    showLocation={currentUser?.show_location}
                    setShowLocation={handleShowLocation}
                    showCity={currentUser?.show_city}
                    setShowCity={handleShowCity}
                    avatar={currentUser?.avatar}
                    setAvatar={handleUpdateAvatar}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen
                name="Contacts"
                component={ContactListScreen}
                options={{
                  tabBarIcon: ({ focused, color, size }) => {
                    const iconName = focused ? "people" : "people-outline";
                    return (
                      <Ionicons name={iconName} size={size} color={color} />
                    );
                  },
                }}
              />
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
  const [userId, setUserId] = useState(null);

  const tokenCache = {
    async getToken(key) {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
        } else {
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
    if (res) {
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
        <UserProvider>
          <StatusBar style="dark" />
          <NavigationContainer>
            <AuthNavigator setUserId={setUserId} />
          </NavigationContainer>
        </UserProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
