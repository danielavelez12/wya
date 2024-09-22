import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();
  console.log({ isSignedIn });

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return <Stack />;
}
