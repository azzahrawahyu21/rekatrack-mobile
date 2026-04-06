import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  View 
} from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setLoggedIn(!!token);
      } catch (err) {
        setLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Loading screen while checking token
  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If not logged in → redirect to login
  if (!loggedIn) {
    return <Redirect href="/login" />;
  }

  // If authenticated → show tabs
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#386BF6",
        tabBarInactiveTintColor: "#9DB2CE",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 10,
          height: 110,       
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("@/assets/icons/home1.png")}
              style={{
                width: 31,
                height: 31,
                tintColor: focused ? "#386BF6" : "#9DB2CE",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          headerShown: false,

          tabBarStyle: {
            display: "none",
          },

          tabBarButton: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.scanButton}>
              <View style={styles.scanGlow} />
              <View style={styles.scanInner}>
                <Image
                  source={require("@/assets/icons/qr-code-white.png")}
                  style={styles.scanImage}
                />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("@/assets/icons/profile.png")}
              style={{
                width: 31,
                height: 31,
                tintColor: focused ? "#386BF6" : "#9DB2CE",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const PRIMARY = "#364981";

const styles = StyleSheet.create({
  scanButton: {
    top: -40, // naik ke atas
    justifyContent: "center",
    alignItems: "center",
  },

  // efek blur / glow
  scanGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PRIMARY,
    opacity: 0.35,
    shadowColor: PRIMARY,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  // tombol utama
  scanInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  scanImage: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
});
