import { useAuth } from "@clerk/clerk-expo";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const [showLocation, setShowLocation] = useState(true);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Handle successful sign out (e.g., navigate to login screen)
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle sign out error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Show My Location</Text>
        <Switch
          trackColor={{ false: "#D2B48C", true: "#DEB887" }}
          thumbColor={showLocation ? "#8B4513" : "#f4f3f4"}
          onValueChange={setShowLocation}
          value={showLocation}
        />
      </View>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
    marginTop: 20,
  },
  signOutButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
