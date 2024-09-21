import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut, isSignedIn } = useAuth();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (isSignedIn) {
      console.log("User is already signed in");
    }
  }, [isSignedIn]);

  const onSignUpPress = async () => {
    if (!isLoaded) {
      console.log("Clerk is not loaded");
      return;
    }

    try {
      await signUp.create({
        phoneNumber,
      });

      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error("Error during sign-up:", JSON.stringify(err, null, 2));
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      console.log("Clerk is not loaded");
      return;
    }

    if (!code) {
      console.error("Verification code is empty");
      return;
    }

    try {
      console.log("Attempting phone number verification with code:", code);
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code,
      });

      console.log("Verification response:", completeSignUp);

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error("Verification not complete:", completeSignUp);
      }
    } catch (err) {
      console.error("Error during verification:", err.message);
      console.error("Error stack:", err.stack);
    }
  };

  const onSignOutPress = async () => {
    try {
      await signOut();
      setPendingVerification(false);
      setPhoneNumber("");
      setCode("");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (!isLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {isSignedIn ? (
        <>
          <Text>You are already signed in.</Text>
          <Button title="Sign Out" onPress={onSignOutPress} />
        </>
      ) : (
        <>
          {!pendingVerification && (
            <>
              <TextInput
                autoCapitalize="none"
                value={phoneNumber}
                placeholder="Phone Number..."
                keyboardType="phone-pad"
                onChangeText={(phone) => setPhoneNumber(phone)}
                style={styles.input}
              />
              <Button title="Sign Up" onPress={onSignUpPress} />
            </>
          )}
          {pendingVerification && (
            <>
              <TextInput
                value={code}
                placeholder="Verification Code..."
                keyboardType="numeric"
                onChangeText={(code) => setCode(code)}
                style={styles.input}
              />
              <Button title="Verify Phone Number" onPress={onPressVerify} />
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
  },
});
