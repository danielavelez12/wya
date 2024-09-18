import * as React from "react";
import { TextInput, Button, View, StyleSheet } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) {
      console.log("Clerk is not loaded");
      return;
    }

    try {
      console.log("Creating sign-up with:", { emailAddress, password });
      await signUp.create({
        emailAddress,
        password,
      });

      console.log("Preparing email address verification");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

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

    try {
      console.log("Attempting email address verification with code:", code);
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error(
          "Verification not complete:",
          JSON.stringify(completeSignUp, null, 2)
        );
      }
    } catch (err) {
      console.error("Error during verification:", JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={styles.container}>
      {!pendingVerification && (
        <>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email..."
            onChangeText={(email) => setEmailAddress(email)}
            style={styles.input}
          />
          <TextInput
            value={password}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            style={styles.input}
          />
          <Button title="Sign Up" onPress={onSignUpPress} />
        </>
      )}
      {pendingVerification && (
        <>
          <TextInput
            value={code}
            placeholder="Code..."
            onChangeText={(code) => setCode(code)}
            style={styles.input}
          />
          <Button title="Verify Email" onPress={onPressVerify} />
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
