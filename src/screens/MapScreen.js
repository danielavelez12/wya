import { MaterialIcons } from "@expo/vector-icons";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const CustomMarker = ({ firstName }) => (
  <View style={styles.markerContainer}>
    <View style={styles.bubble}>
      <MaterialIcons name="person" size={24} color="#FFFFFF" />
    </View>
    <View style={styles.labelBackground}>
      <Text style={styles.markerText}>{firstName}</Text>
    </View>
  </View>
);

const MapScreen = ({ route }) => {
  const [users, setUsers] = useState([]);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const mapRef = useRef(null);
  const { location } = route.params;

  useEffect(() => {
    const fetchUsers = async () => {
      const db = getFirestore();
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const toggleZoom = () => {
    setIsZoomedIn(!isZoomedIn);
    if (isZoomedIn) {
      // Zoom out to US
      mapRef.current.animateToRegion(
        {
          latitude: 37.0902,
          longitude: -95.7129,
          latitudeDelta: 60,
          longitudeDelta: 60,
        },
        1000
      );
    } else {
      // Zoom in to user's location
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
        1000
      );
    }
  };

  const mapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#F6EACB" }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#F6EACB" }],
    },
    {
      featureType: "landscape",
      stylers: [{ visibility: "on" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#9e9e9e",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          color: "#D1E9F6",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#9e9e9e",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.neighborhood",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.park",
      stylers: [{ visibility: "off" }],
    },
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={{
          latitude: 37.0902,
          longitude: -95.7129,
          latitudeDelta: 60,
          longitudeDelta: 60,
        }}
      >
        {users.map((user) => {
          const lat = parseFloat(user.latitude);
          const lng = parseFloat(user.longitude);
          if (isNaN(lat) || isNaN(lng)) return null; // Skip invalid coordinates

          return (
            <Marker
              key={user.id}
              coordinate={{
                latitude: lat + (Math.random() - 0.5) * 0.0001,
                longitude: lng + (Math.random() - 0.5) * 0.0001,
              }}
            >
              <CustomMarker firstName={user.first_name} />
            </Marker>
          );
        })}
      </MapView>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleZoom}>
        <Text style={styles.toggleButtonText}>
          {isZoomedIn ? "Zoom Out" : "Zoom In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: "center",
  },
  bubble: {
    backgroundColor: "#EECAD5",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  labelBackground: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 5,
  },
  markerText: {
    color: "#000000",
    fontSize: 12,
  },
  toggleButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#EECAD5",
    padding: 10,
    borderRadius: 5,
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default MapScreen;
