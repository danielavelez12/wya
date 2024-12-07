import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { deleteUser } from "../api";
import { useUsers } from "../context/UserContext";

const avatars = [
  { name: "bluey", source: require("../../assets/avatars/bluey.png") },
  { name: "catto", source: require("../../assets/avatars/catto.png") },
  { name: "greeny", source: require("../../assets/avatars/greeny.png") },
  { name: "mrfox", source: require("../../assets/avatars/mrfox.png") },
  { name: "porky", source: require("../../assets/avatars/porky.png") },
];

const ProfileScreen = ({
  showLocation,
  setShowLocation,
  showCity,
  setShowCity,
  avatar,
  setAvatar,
}) => {
  const { updateUserPreference } = useUsers();
  const { signOut, userId } = useAuth();

  const handleToggle = async (value) => {
    await setShowLocation(value);
    updateUserPreference(userId, "show_location", value);
  };

  const handleCityToggle = async (value) => {
    await setShowCity(value);
    updateUserPreference(userId, "show_city", value);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAvatarChange = async (avatarName) => {
    await setAvatar(avatarName);
    updateUserPreference(userId, "avatar", avatarName);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(userId);
              await signOut();
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.avatarContainer}>
          {avatars.map((av) => (
            <TouchableOpacity
              key={av.name}
              onPress={() => handleAvatarChange(av.name)}
              style={[
                styles.avatarButton,
                avatar === av.name && styles.selectedAvatar,
              ]}
            >
              <Image source={av.source} style={styles.avatar} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Show my location on the map</Text>
          <Switch
            trackColor={{ false: "#D2B48C", true: "#DEB887" }}
            thumbColor={showLocation ? "#8B4513" : "#f4f3f4"}
            onValueChange={handleToggle}
            value={showLocation}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            Show my city on the contact list
          </Text>
          <Switch
            trackColor={{ false: "#D2B48C", true: "#DEB887" }}
            thumbColor={showCity ? "#8B4513" : "#f4f3f4"}
            onValueChange={handleCityToggle}
            value={showCity}
          />
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountButtonText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAEBD7",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: "#8B4513",
  },
  signOutButton: {
    backgroundColor: "#CD5C5C",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  signOutButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  avatarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(139, 69, 19, 0.1)", // Light brown shade
  },
  selectedAvatar: {
    borderWidth: 2,
    borderColor: "#8B4513",
  },
  avatar: {
    width: 30,
    height: 50,
  },
  deleteAccountButton: {
    backgroundColor: "#8B0000",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  deleteAccountButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
