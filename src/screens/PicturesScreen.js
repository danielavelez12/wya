import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, View } from "react-native";

const PicturesScreen = () => {
  const pictures = [
    require("../../assets/pictures/DSC00974.jpg"),
    require("../../assets/pictures/DSC00982.jpg"),
    require("../../assets/pictures/DSC00986.jpg"),
    require("../../assets/pictures/DSC00988.jpg"),
    require("../../assets/pictures/DSC00992.jpg"),
    require("../../assets/pictures/DSC00998.jpg"),
    require("../../assets/pictures/DSC01039.jpg"),
    require("../../assets/pictures/DSC01081.jpg"),
    require("../../assets/pictures/DSC01083.jpg"),
    require("../../assets/pictures/DSC01106.jpg"),
    require("../../assets/pictures/DSC01110.jpg"),
    require("../../assets/pictures/DSC01125.jpg"),
    require("../../assets/pictures/DSC01137.jpg"),
    require("../../assets/pictures/DSC01139.jpg"),
    require("../../assets/pictures/DSC01148.jpg"),
  ];

  const [imageDimensions, setImageDimensions] = useState([]);

  // Get original image dimensions
  useEffect(() => {
    const getImageSizes = async () => {
      const dimensions = await Promise.all(
        pictures.map((pic) => {
          return new Promise((resolve) => {
            Image.getSize(
              Image.resolveAssetSource(pic).uri,
              (width, height) => {
                resolve({ width, height });
              }
            );
          });
        })
      );
      setImageDimensions(dimensions);
    };

    getImageSizes();
  }, []);

  const shuffledPictures = useMemo(() => {
    return pictures
      .map((pic, index) => ({
        pic,
        dimensions: imageDimensions[index],
      }))
      .sort(() => Math.random() - 0.5);
  }, [imageDimensions]);

  const screenWidth = Dimensions.get("window").width - 20; // Accounting for padding

  // Add washi tape colors
  const washiTapeColors = [
    "#FFB5E8", // pink
    "#B5EAEA", // light blue
    "#FDFD96", // light yellow
    "#B5EAD7", // mint
    "#E6E6FA", // lavender
  ];

  // Random rotation helper
  const getRandomRotation = () => {
    return Math.random() * 6 - 3; // Random rotation between -3 and 3 degrees
  };

  // Random washi tape color helper
  const getRandomWashiColor = () => {
    return washiTapeColors[Math.floor(Math.random() * washiTapeColors.length)];
  };

  return (
    <ScrollView style={styles.container}>
      {shuffledPictures.map(({ pic, dimensions }, index) => {
        if (!dimensions) return null;

        const scaleFactor = screenWidth / dimensions.width;
        const scaledHeight = dimensions.height * scaleFactor;
        const rotation = getRandomRotation();

        return (
          <View key={index} style={styles.imageContainer}>
            <View
              style={[
                styles.polaroidFrame,
                { transform: [{ rotate: `${rotation}deg` }] },
              ]}
            >
              {/* Washi Tape Corners */}
              <View
                style={[
                  styles.washiTape,
                  styles.topLeftTape,
                  { backgroundColor: getRandomWashiColor() },
                ]}
              />
              <View
                style={[
                  styles.washiTape,
                  styles.topRightTape,
                  { backgroundColor: getRandomWashiColor() },
                ]}
              />

              <Image
                source={pic}
                style={[
                  styles.image,
                  {
                    width: screenWidth,
                    height: scaledHeight,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC",
  },
  imageContainer: {
    padding: 10,
    alignItems: "center",
    marginVertical: 15,
  },
  polaroidFrame: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    borderRadius: 2,
  },
  washiTape: {
    position: "absolute",
    width: 40,
    height: 15,
    opacity: 0.7,
    zIndex: 1,
    transform: [{ rotate: "45deg" }],
  },
  topLeftTape: {
    top: -5,
    left: -5,
  },
  topRightTape: {
    top: -5,
    right: -5,
  },
});

export default PicturesScreen;
