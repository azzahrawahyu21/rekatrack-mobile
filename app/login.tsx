// app/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import Button from "../components/ui/button";
import { PasswordField, TextField } from "../components/ui/FormControl";
import { Colors } from "../constants/colors";
import { Fonts } from "../constants/fonts";
import { apiFetch } from "../utils/api";

export default function LoginScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: "", // jaga-jaga kalau headerShown gagal
        }}
      />
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* background utama putih */}
          <LoginScreenInner />
        </View>
      </SafeAreaProvider>
    </>
  );
}

function LoginScreenInner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState(""); // email atau NIP
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTitle, setAlertTitle] = useState("Info");

  const slideAnim = useRef(new Animated.Value(200)).current;
  const passwordRef = useRef<TextInput | null>(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const showCustomAlert = (msg: string, title: string = "Info") => {
    setAlertMsg(msg);
    setAlertTitle(title);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }), // sesuaikan API Anda
      });

      if (!res.access_token) {
        showCustomAlert("NIP/Email atau kata sandi salah", "Gagal Masuk");
        return;
      }

      await AsyncStorage.multiSet([
        ["token", res.access_token],
        ["user", JSON.stringify(res.data)],
        ["role", res.data.role?.name ?? ""],
        ["division", res.data.role?.division?.name ?? ""],
      ]);

      showCustomAlert(res.message ?? "Login berhasil", "Berhasil Masuk");

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 800);
    } catch (error) {
      console.error("Login Error:", error);
      showCustomAlert("Terjadi kesalahan server", "Login Gagal");
    } finally {
      setLoading(false);
    }
  };

  const CustomAlert = ({ visible, onClose, title, message }: any) => (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            width: "80%",
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, textAlign: "center", marginBottom: 20 }}>
            {message}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#1E3A8A",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
            onPress={onClose}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.navy }}
      behavior={
        Platform.OS === "ios" || Platform.OS === "android"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {loading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999,
            }}
          >
            <Text style={{ color: "#fff" }}>Memproses...</Text>
          </View>
        )}

        <View
          style={{
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            backgroundColor: Colors.navy,
          }}
        >
          <Image
            source={require("../assets/images/login-graphic.png")}
            style={{ width: 350, height: 300 }}
            resizeMode="contain"
          />

          <View style={{ width: "90%" }}>
            <Text style={[Fonts.header1, { color: Colors.white }]}>
              Halo, Selamat Datang!
            </Text>
            <Text
              style={[
                Fonts.paragraphRegularSmall,
                { color: "#e0e0e0", marginTop: 5 },
              ]}
            >
              Tracking Pengiriman di mana pun dan kapan pun.
            </Text>
          </View>
        </View>

        <Animated.View
          style={{
            flexGrow: 1,
            backgroundColor: Colors.white,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 24,
            paddingVertical: 25,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={[Fonts.header1, { marginBottom: 20 }]}>Masuk</Text>

          <TextField
            label="Email"
            placeholder="Masukkan Email Anda..."
            value={email}
            onChangeText={setEmail}
            helperText={errors.email}
            status={errors.email ? "error" : "default"}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <PasswordField
            label="Kata Sandi"
            placeholder="Masukkan Kata Sandi..."
            value={password}
            onChangeText={setPassword}
            helperText={errors.password}
            status={errors.password ? "error" : "default"}
            secureTextEntry
            ref={passwordRef}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
          />

          <Button
            title={loading ? "Loading..." : "Masuk"}
            size="large"
            variant="solid"
            onPress={handleLogin}
            style={{ width: "100%", marginTop: 10 }}
          />

          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMsg}
            onClose={() => setAlertVisible(false)}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
