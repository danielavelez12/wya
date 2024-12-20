import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useUsers } from "../context/UserContext";

const CONTACT_LIST = [
  "Amir",
  "Anthea",
  "Anthony",
  "Ashley",
  "Bailey",
  "Charles",
  "Chinemerem",
  "Christina",
  "Clo",
  "Dani",
  "Emma",
  "Ethan",
  "Jaclyn",
  "Kasra",
  "Kayla",
  "Lidia",
  "Mathurah",
  "Max",
  "Praise",
  "Quinn",
  "Ryan",
  "Sabiha",
  "Said",
  "Vicki",
  "Will",
];

async function getCityFromCoordinates(latitude, longitude) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.results && data.results[0]) {
      const cityComponent = data.results[0].address_components.find(
        (component) => component.types.includes("locality")
      );
      return cityComponent ? cityComponent.long_name : "Unknown Location";
    }
    return "Unknown Location";
  } catch (error) {
    console.error("Error getting city:", error);
    return "Unknown Location";
  }
}

function ContactListScreen({ userId }) {
  const { users } = useUsers();
  const [loading, setLoading] = useState(true);
  const [userCities, setUserCities] = useState({});

  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = {};
        for (const user of users) {
          if (user.latitude && user.longitude) {
            const city = await getCityFromCoordinates(
              user.latitude,
              user.longitude
            );
            cities[user.id] = city;
          }
        }
        setUserCities(cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, [users]);

  const findMatchingUser = (contactName) => {
    return users.find(
      (user) => user.first_name?.toLowerCase() === contactName?.toLowerCase()
    );
  };

  const isUserBlocked = (matchingUser) => {
    if (!matchingUser) return false;

    // Find current user
    const currentUser = users.find((u) => u.clerk_user_id === userId);

    // Check if the user is blocked by current user or has blocked current user
    return (
      matchingUser.blockedBy?.includes(userId) ||
      currentUser?.blocked?.includes(matchingUser.clerk_user_id)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {CONTACT_LIST.map((contact, index) => {
        const matchingUser = findMatchingUser(contact);

        // Skip rendering if user is blocked
        if (isUserBlocked(matchingUser)) return null;

        return (
          <View key={index} style={styles.contactItem}>
            <Text style={styles.contactName}>{contact}</Text>
            {matchingUser && (
              <Text style={styles.contactDetails}>
                {matchingUser.show_city &&
                  userCities[matchingUser.id] &&
                  `${userCities[matchingUser.id]} as of ${new Date(matchingUser.last_updated).toLocaleDateString()}\n`}
                {matchingUser.email && `${matchingUser.email.toLowerCase()}`}
                {matchingUser.phone && `\n${matchingUser.phone}`}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DEB887",
  },
  contactName: {
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  contactDetails: {
    marginTop: 4,
    fontSize: 14,
    color: "#666666",
  },
});

export default ContactListScreen;
