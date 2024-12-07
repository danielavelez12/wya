import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const avatars = {
  bluey: require("../../assets/avatars/bluey.png"),
  catto: require("../../assets/avatars/catto.png"),
  greeny: require("../../assets/avatars/greeny.png"),
  mrfox: require("../../assets/avatars/mrfox.png"),
  porky: require("../../assets/avatars/porky.png"),
};

export default function PersonModal({
  isVisible,
  onClose,
  person,
  showBlockOption,
  onBlock,
}) {
  const [blockText, setBlockText] = useState(
    "Block user from seeing my location"
  );

  useEffect(() => {
    setBlockText("Block user from seeing my location");
  }, [isVisible]);

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${person.email}`);
  };

  const handleTextPress = () => {
    Linking.openURL(`sms:${person.phoneNumber}`);
  };

  const formatName = (fullName) => {
    const names = fullName.split(" ");
    if (names.length > 1) {
      return `${names[0]} ${names[names.length - 1][0]}.`;
    }
    return fullName;
  };

  const handleBlock = async () => {
    setBlockText("User has been blocked from seeing your location.");
    await onBlock();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.centeredView}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalView} onStartShouldSetResponder={() => true}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
          <View style={styles.personInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={avatars[person.avatar] || avatars.bluey}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.name}>{formatName(person.name)}</Text>
          </View>
          <Text style={styles.lastUpdated}>
            Last updated: {formatDate(person.lastUpdated)}
          </Text>
          <TouchableOpacity
            onPress={handleEmailPress}
            style={styles.contactContainer}
          >
            <Ionicons name="mail" size={16} color="#8B4513" />
            <Text style={styles.contactInfo}>{person.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleTextPress}
            style={styles.contactContainer}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color="#8B4513" />
            <Text style={[styles.contactInfo, styles.underlined]}>
              {person.phoneNumber}
            </Text>
          </TouchableOpacity>
          {showBlockOption && (
            <TouchableOpacity onPress={handleBlock}>
              <Text
                style={[
                  styles.blockText,
                  blockText.startsWith("User has been")
                    ? { color: "#808080" }
                    : { color: "#CD5C5C", textDecorationLine: "underline" },
                ]}
              >
                {blockText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "#FFF8DC",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 5,
  },
  personInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarContainer: {
    backgroundColor: "rgba(139, 69, 19, 0.1)",
    borderRadius: 40,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  avatar: {
    width: 25,
    height: 30,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
  },
  lastUpdated: {
    fontSize: 14,
    color: "#A0522D",
    marginBottom: 15,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 16,
    color: "#8B4513",
    marginLeft: 8,
  },
  underlined: {
    textDecorationLine: "underline",
  },
  blockText: {
    textAlign: "center",
    marginTop: 15,
  },
});
