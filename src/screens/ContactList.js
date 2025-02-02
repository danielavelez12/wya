import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
      return cityComponent ? cityComponent.long_name : null;
    }
    return null;
  } catch (error) {
    console.error("Error getting city:", error);
    return null;
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
            if (city) {
              cities[user.id] = city;
            }
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

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleTextPress = (phoneNumber) => {
    Linking.openURL(`sms:${phoneNumber}`);
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

        if (isUserBlocked(matchingUser)) return null;

        return (
          <View key={index} style={styles.contactItem}>
            <Text style={styles.contactName}>{contact}</Text>
            {matchingUser && (
              <View>
                {matchingUser.show_city && userCities[matchingUser.id] && (
                  <Text style={styles.contactDetails}>
                    {`${userCities[matchingUser.id]} as of ${new Date(
                      matchingUser.last_updated
                    ).toLocaleDateString()}`}
                  </Text>
                )}
                {matchingUser.email && (
                  <TouchableOpacity
                    onPress={() => handleEmailPress(matchingUser.email)}
                    style={styles.contactRow}
                  >
                    <Ionicons name="mail" size={16} color="#8B4513" />
                    <Text style={[styles.contactDetails, styles.clickable]}>
                      {matchingUser.email.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                )}
                {matchingUser.phone_number && (
                  <TouchableOpacity
                    onPress={() => handleTextPress(matchingUser.phone_number)}
                    style={styles.contactRow}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={16}
                      color="#8B4513"
                    />
                    <Text style={[styles.contactDetails, styles.clickable]}>
                      {matchingUser.phone_number.replace(
                        /(\d{1})(\d{3})(\d{3})(\d{4})/,
                        "$1 ($2) $3-$4"
                      )}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
    fontSize: 14,
    color: "#666666",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  clickable: {
    marginLeft: 8,
    textDecorationLine: "underline",
  },
});

export default ContactListScreen;
