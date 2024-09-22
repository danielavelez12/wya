import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut, isSignedIn } = useAuth();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

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
        setVerified(true);
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>RabbitHolers</Text>
      {isSignedIn ? (
        <>
          <Text style={styles.label}>You are already signed in.</Text>
          <TouchableOpacity style={styles.button} onPress={onSignOutPress}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {!pendingVerification && (
            <>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                onChangeText={(phone) => setPhoneNumber(phone)}
              />
              <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
          {pendingVerification && !name && !email && (
            <>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.input}
                value={code}
                placeholder="Enter verification code"
                keyboardType="numeric"
                onChangeText={(code) => setCode(code)}
              />
              <TouchableOpacity style={styles.button} onPress={onPressVerify}>
                <Text style={styles.buttonText}>Verify</Text>
              </TouchableOpacity>
            </>
          )}
          {verified && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={onCompleteSignUp}
              >
                <Text style={styles.buttonText}>Complete Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const onCompleteSignUp = async () => {
  if (!isLoaded) {
    console.log("Clerk is not loaded");
    return;
  }

  try {
    const completeSignUp = await signUp.update({
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" "),
      emailAddress: email,
    });

    if (completeSignUp.status === "complete") {
      await setActive({ session: completeSignUp.createdSessionId });
      router.replace("/");
    } else {
      console.error("Sign up not complete:", completeSignUp);
    }
  } catch (err) {
    console.error("Error during sign up completion:", err.message);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#FAEBD7",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#DEB887",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
