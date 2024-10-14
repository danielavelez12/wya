import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { fetchUsers } from "../api"; // Make sure this import is present
import BottomCarousel from "../components/BottomCarousel";
import PersonModal from "../components/PersonModal";

const avatars = {
  bluey: require("../../assets/avatars/bluey.png"),
  catto: require("../../assets/avatars/catto.png"),
  greeny: require("../../assets/avatars/greeny.png"),
  mrfox: require("../../assets/avatars/mrfox.png"),
  porky: require("../../assets/avatars/porky.png"),
};

const CustomMarker = ({ firstName, avatar }) => (
  <View style={styles.markerContainer}>
    <View style={styles.bubble}>
      <Image source={avatars[avatar] || avatars.bluey} style={styles.avatar} />
    </View>
    <View style={styles.labelBackground}>
      <Text style={styles.markerText}>{firstName}</Text>
    </View>
  </View>
);

const MapScreen = ({ location, avatar, userId }) => {
  const [users, setUsers] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState([]);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const mapRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const usersList = await fetchUsers();
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsersData();
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

  const onRegionChangeComplete = (region) => {
    const newVisibleUsers = users.filter((user) => {
      const lat = parseFloat(user.latitude);
      const lng = parseFloat(user.longitude);
      return (
        lat >= region.latitude - region.latitudeDelta / 2 &&
        lat <= region.latitude + region.latitudeDelta / 2 &&
        lng >= region.longitude - region.longitudeDelta / 2 &&
        lng <= region.longitude + region.longitudeDelta / 2
      );
    });
    setVisibleUsers(newVisibleUsers);
  };

  const handleMarkerPress = (user) => {
    setSelectedUser(user);
  };

  const handlePersonSelect = (person) => {
    const selectedUser = visibleUsers.find(
      (user) => user.first_name + " " + user.last_name === person.name
    );
    setSelectedUser(selectedUser);
  };

  const mapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#F6EACB" }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#FAEBD7" }],
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
        padding={{ bottom: 100 }} // Add padding to the bottom of the map
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {users.map((user) => {
          if (!user.show_location) return null; // Skip users who don't want to show their location
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
              onPress={() => handleMarkerPress(user)}
            >
              <CustomMarker
                firstName={user.first_name}
                avatar={user.clerk_user_id === userId ? avatar : user.avatar}
              />
            </Marker>
          );
        })}
      </MapView>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleZoom}>
        <Text style={styles.toggleButtonText}>
          {isZoomedIn ? "Zoom Out" : "Zoom In"}
        </Text>
      </TouchableOpacity>
      <PersonModal
        isVisible={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        person={{
          name: selectedUser?.first_name + " " + selectedUser?.last_name,
          phoneNumber: selectedUser?.phone_number,
          email: selectedUser?.email,
          lastUpdated: selectedUser?.last_updated,
          avatar:
            selectedUser?.clerk_user_id === userId
              ? avatar
              : selectedUser?.avatar,
        }}
      />
      <BottomCarousel
        people={visibleUsers.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          avatar: user.clerk_user_id === userId ? avatar : user.avatar,
          show_location: user.show_location,
        }))}
        onPersonSelect={handlePersonSelect}
        currentUserId={userId}
      />
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
    backgroundColor: "rgba(139, 69, 19, 0.1)", // Light brown shade, matching ProfileScreen
    borderRadius: 30, // Make it completely round
    width: 40,
    height: 40,
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
    backgroundColor: "#CD5C5C",
    padding: 10,
    borderRadius: 5,
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  avatar: {
    width: 20,
    height: 30,
  },
});

export default MapScreen;
