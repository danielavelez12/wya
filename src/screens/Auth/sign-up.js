import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PhoneInput from "react-native-phone-input";
import { SafeAreaView } from "react-native-safe-area-context";

import { createUser } from "../../api";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut, isSignedIn } = useAuth();
  const navigation = useNavigation();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [clerkUserID, setClerkUserID] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
    }
  }, [isSignedIn]);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      setErrorMessage("");
      await signUp.create({
        phoneNumber,
        password,
      });

      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error("Error during sign-up:", JSON.stringify(err, null, 2));
      if (err.errors && err.errors.length > 0) {
        setErrorMessage(err.errors[0].message);
      } else {
        setErrorMessage(err.message || "An error occurred during sign up");
      }
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    if (!code) {
      console.error("Verification code is empty");
      return;
    }

    try {
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        setVerified(true);
        setSessionId(completeSignUp.createdSessionId);
        setClerkUserID(completeSignUp.createdUserId);
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

  const onCompleteSignUp = async () => {
    await createUser(phoneNumber, firstName, lastName, email, clerkUserID);
    await setActive({ session: sessionId });
    setVerified(true);
    navigation.replace("Map");
  };

  const isFormValid = () => {
    return phoneNumber && password && termsAccepted;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/Logo.png")}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Create your account</Text>
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
              <PhoneInput
                style={styles.input}
                initialCountry="us"
                value={phoneNumber}
                onChangePhoneNumber={(displayValue) =>
                  setPhoneNumber(displayValue)
                }
                inputStyle={styles.input}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
              <View style={styles.termsContainer}>
                <Pressable
                  style={styles.checkbox}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  {termsAccepted && <View style={styles.checkboxChecked} />}
                </Pressable>
                <Text style={styles.termsText}>
                  I agree to the Terms of Service and acknowledge that any
                  objectionable content or abusive behavior will result in
                  immediate account termination
                </Text>
              </View>
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.button, !isFormValid() && styles.buttonDisabled]}
                onPress={onSignUpPress}
                disabled={!isFormValid()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                  <Text style={styles.signInLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {pendingVerification && !verified && (
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
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your name"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your name"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={onCompleteSignUp}
              >
                <Text style={styles.buttonText}>Complete signup</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

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
  logoContainer: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
  },
  errorText: {
    marginBottom: 10,
    color: "red",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signInText: {
    color: "#8B4513",
    marginRight: 5,
  },
  signInLink: {
    color: "#DEB887",
    fontWeight: "bold",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#8B4513",
    marginRight: 10,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: "#8B4513",
    borderRadius: 2,
  },
  termsText: {
    flex: 1,
    color: "#8B4513",
    fontSize: 14,
  },
  buttonDisabled: {
    backgroundColor: "#DEB887",
    opacity: 0.3,
  },
});
