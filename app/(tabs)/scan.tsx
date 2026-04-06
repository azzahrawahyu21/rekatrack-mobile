import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ScanScreen() {
  const router = useRouter();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState<"on" | "off">("off");
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Saat screen ini difokuskan (dibuka atau kembali dari navigasi), reset scanned
      setScanned(false);
      hasNavigatedRef.current = false;

      // Optional: reset flash juga kalau mau
      // setFlash('off');

      // Cleanup (tidak wajib, tapi bagus)
      return () => {
        // Saat screen unfocus (misal pindah tab), bisa set scanned true biar tidak scan di background
        setScanned(true);
      };
    }, []),
  );
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;
    setScanned(true);

    // Langsung navigasi ke halaman hasil scan dengan parameter code
    router.replace({
      pathname: "/hasil_scan",
      params: { code: data },
    });
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
    });

    if (!result.canceled) {
      alert("Gambar dipilih, fitur scan galeri bisa ditambahkan");
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Meminta izin kamera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>Tidak ada akses kamera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CAMERA */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={flash === "on"}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "code128", "ean13", "ean8"],
        }}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* SCAN AREA */}
      <View style={styles.scanArea}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instruction}>Arahkan kamera ke barcode!</Text>
        <Text style={styles.subInstruction}>
          Pastikan barcode terlihat jelas dalam frame
        </Text>
      </View>

      {/* BOTTOM ACTION */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          onPress={() => setFlash(flash === "on" ? "off" : "on")}
          style={styles.actionItem}
          activeOpacity={0.7}
        >
          <Ionicons
            name={flash === "on" ? "flash" : "flash-off"}
            size={28}
            color="#fff"
          />
          <Text style={styles.actionText}>Flash</Text>
        </TouchableOpacity>

        {/* GALERI */}
        <TouchableOpacity
          onPress={openGallery}
          style={styles.actionItem}
          activeOpacity={0.7}
        >
          <Ionicons name="images" size={28} color="#fff" />
          <Text style={styles.actionText}>Galeri</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER */
  header: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  /* SCAN */
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanBox: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
  },
  instruction: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subInstruction: {
    color: "#ccc",
    fontSize: 13,
  },

  /* BOTTOM */
  bottomActions: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: "relative",
    marginBottom: 16,
  },

  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  actionItem: {
    alignItems: "center",
  },

  actionText: {
    marginTop: 6,
    fontSize: 12,
    color: "#fff",
  },
});
