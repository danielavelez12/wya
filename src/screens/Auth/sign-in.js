import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
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
      console.error(JSON.stringify(err, null, 2));
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
        router.replace("/");
      } else {
        console.error(JSON.stringify(completeSignIn, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, code, signIn, setActive, router]);

  return (
    <View style={styles.container}>
      {!pendingVerification ? (
        <>
          <TextInput
            autoCapitalize="none"
            keyboardType="phone-pad"
            value={phoneNumber}
            placeholder="Phone Number..."
            onChangeText={(phoneNumber) => setPhoneNumber(phoneNumber)}
            style={styles.input}
          />
          <Button title="Sign In" onPress={onSignInPress} />
        </>
      ) : (
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
      <View>
        <Text>Don't have an account?</Text>
        <Link href="/sign-up">
          <Text>Sign up</Text>
        </Link>
      </View>
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
