import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LocationDisabledScreen = ({ onEnableLocation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Please enable showing your location to see the map :)
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={(e) => {
          e.preventDefault();
          onEnableLocation(true);
        }}
        accessibilityLabel="Enable location"
      >
        <Text style={styles.buttonText}>Show my location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: "#8B4513",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#DEB887",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LocationDisabledScreen;
