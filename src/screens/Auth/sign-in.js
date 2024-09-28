import { useSignIn } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PhoneInput from "react-native-phone-input";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigation = useNavigation();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      console.log({ phoneNumber });
      const { supportedFirstFactors } = await signIn.create({
        identifier: phoneNumber,
      });

      const isPhoneCodeFactor = (factor) => {
        return factor.strategy === "phone_code";
      };
      const phoneCodeFactor = supportedFirstFactors?.find(isPhoneCodeFactor);

      // Grab the phoneNumberId
      const { phoneNumberId } = phoneCodeFactor;

      // Send the OTP code to the user
      await signIn.prepareFirstFactor({
        strategy: "phone_code",
        phoneNumberId,
      });

      setPendingVerification(true);
    } catch (err) {
      if (err.status === 422) {
        setErrorMessage("Whoops, no account found. Signed up yet?");
      } else {
        console.error(JSON.stringify(err, null, 2));
      }
    }
  }, [isLoaded, phoneNumber, signIn]);

  const onPressVerify = useCallback(async () => {
    if (!isLoaded || !code) {
      return;
    }

    try {
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: "phone_code",
        code,
      });

      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
        navigation.replace("/");
      } else {
        console.error(JSON.stringify(completeSignIn, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, code, signIn, setActive, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/Logo.png")}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Rabbitholers</Text>
      {!pendingVerification ? (
        <View>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <PhoneInput
              style={styles.input}
              initialCountry="us"
              value={phoneNumber}
              onChangePhoneNumber={(displayValue, iso2) =>
                setPhoneNumber(displayValue)
              }
              inputStyle={styles.input}
            />
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.button} onPress={onSignInPress}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.label}>Verification Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={code}
              placeholder="Enter verification code"
              keyboardType="numeric"
              onChangeText={(code) => setCode(code)}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={onPressVerify}>
            <Text style={styles.buttonText}>Verify Phone Number</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.signUpLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8DC",
    padding: 20,
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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    padding: 10,
    fontSize: 16,
    backgroundColor: "#FAEBD7",
    borderRadius: 8,
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
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: {
    color: "#8B4513",
    marginRight: 5,
  },
  signUpLink: {
    color: "#DEB887",
    fontWeight: "bold",
  },
  errorText: {
    marginTop: 4,
    color: "gray",
  },
});
