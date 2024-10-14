import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 5;

const avatars = {
  bluey: require("../../assets/avatars/bluey.png"),
  catto: require("../../assets/avatars/catto.png"),
  greeny: require("../../assets/avatars/greeny.png"),
  mrfox: require("../../assets/avatars/mrfox.png"),
  porky: require("../../assets/avatars/porky.png"),
};

const BottomCarousel = ({ people, onPersonSelect, currentUserId }) => {
  console.log(people);
  const visiblePeople = people.filter((person) => person.show_location);

  if (visiblePeople.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visiblePeople.map((person, index) => (
          <TouchableOpacity
            key={index}
            style={styles.personItem}
            onPress={() => onPersonSelect(person)}
            accessibilityLabel={`View ${person.name}'s information`}
          >
            <View style={styles.iconContainer}>
              <Image
                source={avatars[person.avatar] || avatars.bluey}
                style={styles.avatar}
              />
            </View>
            <Text
              style={styles.personName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {person.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 248, 220, 0.9)", // Semi-transparent Cornsilk
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  personItem: {
    width: ITEM_WIDTH,
    alignItems: "center",
    marginHorizontal: 5,
  },
  iconContainer: {
    backgroundColor: "rgba(139, 69, 19, 0.1)",
    borderRadius: 30,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  avatar: {
    width: 25,
    height: 35,
  },
  personName: {
    fontSize: 12,
    color: "#8B4513",
    textAlign: "center",
    width: "100%",
  },
});

export default BottomCarousel;
