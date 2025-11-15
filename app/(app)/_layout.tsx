import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Spinner } from "tamagui";

// Custom plus button component
function PlusButton() {
  const router = useRouter();
}

export default function Layout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <Spinner />;
  }

  return (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="new-entry" options={{ headerShown: false }} />
        <Stack.Screen name="edit-entry/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="entry/[id]" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
