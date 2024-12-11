import { useAuth } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import {
  Alert,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { callBlockUser, deleteUser, reportContent } from "../api";
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
  const { updateUserPreference, users } = useUsers();
  const { signOut, userId } = useAuth();
  const [safetyControlsOpen, setSafetyControlsOpen] = React.useState(false);
  const [blockModalVisible, setBlockModalVisible] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [reportModalVisible, setReportModalVisible] = React.useState(false);
  const [reportedUser, setReportedUser] = React.useState(null);
  const [reportExplanation, setReportExplanation] = React.useState("");

  if (Platform.OS === "android") {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

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

  const toggleSafetyControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSafetyControlsOpen(!safetyControlsOpen);
  };

  const handleBlockUser = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user to block");
      return;
    }

    try {
      // Get current user's blocked list
      const currentUser = users.find((u) => u.clerk_user_id === userId);
      const blockedList = currentUser?.blocked || [];

      // Add the selected user to the blocked list
      await updateUserPreference(userId, "blocked", [
        ...blockedList,
        selectedUser,
      ]);

      await callBlockUser(userId, selectedUser.clerk_user_id);
      setBlockModalVisible(false);
      setSelectedUser(null);
      Alert.alert("Success", "User has been blocked");
    } catch (error) {
      console.error("Error blocking user:", error);
      Alert.alert("Error", "Failed to block user. Please try again.");
    }
  };

  const handleReport = async () => {
    if (!reportedUser || !reportExplanation.trim()) {
      Alert.alert("Error", "Please select a user and provide an explanation");
      return;
    }

    try {
      await reportContent(userId, reportedUser, reportExplanation.trim());
      setReportModalVisible(false);
      setReportedUser(null);
      setReportExplanation("");
      Alert.alert("Success", "Report submitted successfully");
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  const blockUserButton = (
    <>
      <TouchableOpacity
        style={styles.blockUserButton}
        onPress={() => setBlockModalVisible(true)}
      >
        <Text style={styles.blockUserButtonText}>Block a user</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={blockModalVisible}
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a user to block</Text>

            <Picker
              selectedValue={selectedUser}
              onValueChange={(itemValue) => setSelectedUser(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a user..." value={null} />
              {users
                .filter((user) => user.clerk_user_id !== userId) // Don't show current user
                .map((user) => (
                  <Picker.Item
                    key={user.clerk_user_id}
                    label={user.first_name || user.email}
                    value={user.clerk_user_id}
                  />
                ))}
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setBlockModalVisible(false);
                  setSelectedUser(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.blockButton]}
                onPress={handleBlockUser}
              >
                <Text style={styles.modalButtonText}>Block User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  const reportUserButton = (
    <>
      <TouchableOpacity
        style={styles.blockUserButton}
        onPress={() => setReportModalVisible(true)}
      >
        <Text style={styles.blockUserButtonText}>
          Flag objectionable content
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report content</Text>

            <Picker
              selectedValue={reportedUser}
              onValueChange={(itemValue) => setReportedUser(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a user..." value={null} />
              {users
                .filter((user) => user.clerk_user_id !== userId)
                .map((user) => (
                  <Picker.Item
                    key={user.clerk_user_id}
                    label={user.first_name || user.email}
                    value={user.clerk_user_id}
                  />
                ))}
            </Picker>

            <TextInput
              style={[
                styles.picker,
                {
                  height: 100,
                  textAlignVertical: "top",
                  padding: 20,
                  paddingTop: 20,
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Please explain the issue..."
              value={reportExplanation}
              onChangeText={setReportExplanation}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setReportModalVisible(false);
                  setReportedUser(null);
                  setReportExplanation("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.blockButton]}
                onPress={handleReport}
              >
                <Text style={styles.modalButtonText}>Submit report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

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
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>
              Show my current location on the map
            </Text>
            <Text style={styles.settingSubtext}>
              This will only show your current location while you're on the
              rabbitholers app and will not update your location in the
              background.
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#D2B48C", true: "#DEB887" }}
            thumbColor={showLocation ? "#8B4513" : "#f4f3f4"}
            onValueChange={handleToggle}
            value={showLocation}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            Show my current city on the contact list
          </Text>
          <Switch
            trackColor={{ false: "#D2B48C", true: "#DEB887" }}
            thumbColor={showCity ? "#8B4513" : "#f4f3f4"}
            onValueChange={handleCityToggle}
            value={showCity}
          />
        </View>
        <View style={styles.dangerZoneContainer}>
          <TouchableOpacity
            style={styles.dangerZoneHeader}
            onPress={toggleSafetyControls}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerZoneTitle}>Safety controls</Text>
            <MaterialIcons
              name={safetyControlsOpen ? "expand-less" : "expand-more"}
              size={24}
              color="#8B0000"
            />
          </TouchableOpacity>

          {safetyControlsOpen && (
            <>
              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteAccountButtonText}>
                  Delete account
                </Text>
              </TouchableOpacity>
              {blockUserButton}
              {reportUserButton}
            </>
          )}
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  settingLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 4,
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
  settingSubtext: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  dangerZoneContainer: {
    backgroundColor: "#FAEBD7",
    borderRadius: 8,
    padding: 15,
    flex: 1,
    overflow: "hidden",
  },
  dangerZoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dangerZoneTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#8B0000",
  },
  blockUserButton: {
    backgroundColor: "#8B0000",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  blockUserButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF8DC",
    borderRadius: 8,
    padding: 20,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 15,
    textAlign: "center",
  },
  picker: {
    backgroundColor: "#FAEBD7",
    marginBottom: 15,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#CD5C5C",
  },
  blockButton: {
    backgroundColor: "#8B0000",
  },
  modalButtonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default ProfileScreen;
