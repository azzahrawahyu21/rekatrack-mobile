// app/hasil_scan/index.tsx

import { apiFetch } from "@/utils/api";
import { LOCATION_TASK_NAME } from "@/utils/locationTask";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DetailPengiriman = {
  id: number;
  no_travel_document: string;
  send_to: string;
  status: string;
  project?: string;
  date_no_travel_document?: string;
  po_number?: string;
  reference_number?: string;
};

export default function HasilScanScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [id, setId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailPengiriman | null>(null);
  const [loading, setLoading] = useState(true);
  // const [status, setStatus] = useState('non active');
  const [status, setStatus] = useState("Belum Aktif");
  const [tracerActive, setTracerActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activatingTracer, setActivatingTracer] = useState(false);
  const [navigatingComplete, setNavigatingComplete] = useState(false);

  // Ekstrak ID dari code (misal SJNID:123 → 123)
  useEffect(() => {
    if (code && code.startsWith("SJNID:")) {
      const extractedId = parseInt(code.substring(6), 10);
      if (!isNaN(extractedId)) {
        setId(extractedId);
      } else {
        Alert.alert("Error", "Format code tidak valid");
        router.back();
      }
    } else {
      Alert.alert("Error", "Data scan tidak valid");
      router.back();
    }
  }, [code]);

  const fetchDetail = useCallback(async () => {
    try {
      const response = await apiFetch(`/travel-document/${id}`);
      if (response?.data) {
        setDetail(response.data);

        // Mapping status dari backend ke tampilan di app
        const backendStatus = response.data.status;
        if (backendStatus === "Terkirim") {
          setStatus("Terkirim");
        } else if (backendStatus === "Sedang dikirim") {
          setStatus("Aktif");
          setTracerActive(true); // otomatis aktifkan tombol kalau sudah sedang dikirim
        } else {
          setStatus("Belum Aktif");
        }
      } else {
        Alert.alert("Error", "Gagal memuat detail pengiriman");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id]);


  // Fetch detail pengiriman berdasarkan ID
  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);
  // Fungsi ambil lokasi GPS
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Error", "Izin lokasi diperlukan");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const startBackgroundTracking = useCallback(async (travelDocumentId: number) => {
    try {
    const foregroundPermission = await Location.requestForegroundPermissionsAsync();
    if (foregroundPermission.status !== "granted") {
      Alert.alert("Izin lokasi", "Izin lokasi foreground diperlukan.");
      return false;
    }

    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    if (backgroundPermission.status !== "granted") {
      Alert.alert(
        "Izin lokasi background",
        "Aktifkan izin 'Always' agar tracking tetap berjalan saat aplikasi di background.",
      );
      return false;
    }

    await AsyncStorage.setItem("ACTIVE_SJN_ID", String(travelDocumentId));

    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!started) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        distanceInterval: 100,
        deferredUpdatesDistance: 100,
        deferredUpdatesInterval: 60000,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "Rekatrack Tracking Aktif",
          notificationBody: "Tracking pengiriman sedang berjalan di background",
        },
      });
    }

    return true;
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Gagal memulai tracking background");
      return false;
    }
  }, []);

  useEffect(() => {
    const syncBackgroundTracking = async () => {
      if (!id || !tracerActive) return;
      try {
        const started = await startBackgroundTracking(id);
        if (!started) {
          setTracerActive(false);
          setStatus("Belum Aktif");
        }
      } catch (error) {
        console.warn("Gagal memulai background tracking:", error);
      }
    };

    syncBackgroundTracking();
  }, [id, tracerActive, startBackgroundTracking]);

  // Klik "Hidupkan Tracer"
  const handleHidupkanTracer = async () => {
    if (!id || activatingTracer) return;

    const location = await getLocation();
    if (!location) return;

    try {
      setActivatingTracer(true);
      await apiFetch("/send-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            travel_document_id: [id],
            latitude: location.latitude,
            longitude: location.longitude,
          }),
      });
      setStatus("Aktif"); // ubah jadi "Aktif"
      setTracerActive(true);

      const started = await startBackgroundTracking(id);

      if (!started) {
        setTracerActive(false);
        setStatus("Belum Aktif");
        return;
      }

      Alert.alert("Sukses", "Tracer dihidupkan dan lokasi dikirim", [
          {
            text: "OK",
            onPress: () => {
              // Pindah ke halaman detail pengiriman dengan pass id
              router.replace({
                pathname: "/pengiriman/detail",
                params: { id: id.toString() }, // id sebagai string
              });
            },
          },
        ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Gagal menghidupkan tracer");
    } finally {
      setActivatingTracer(false);
    }
  };

  const handleSelesaikanPengiriman = async () => {
    if (!id || !detail || navigatingComplete) return;

    try {
      setNavigatingComplete(true);
      router.replace({
        pathname: "/pengiriman/selesai",
        params: {
          id: id.toString(),
          no: detail.no_travel_document,
          send_to: detail.send_to,
          project: detail.project || "",
        },
      });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Gagal membuka halaman penyelesaian");
    } finally {
      setNavigatingComplete(false);
    }
  };


  const handleRefresh = async () => {
    if (!id) return;
    try {
      setRefreshing(true);
      await fetchDetail();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Memuat...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Hasil Scan</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#1E3A8A"]}
              tintColor="#1E3A8A"
            />
          }
        >
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="cube-outline" size={35} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.scanSuccessTextHeader}>Scan berhasil</Text>
                <Text style={styles.dataPengirimanTextHeader}>
                  Data Pengiriman
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.sectionTitle}>Surat Jalan</Text>
            <Text style={styles.dataValue}>
              {detail?.no_travel_document || "-"}
            </Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
            <Text style={styles.dataValue}>{detail?.send_to || "-"}</Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.sectionTitle}>Status Pengiriman</Text>
            <Text style={styles.statusValue}>{status}</Text>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[styles.button, tracerActive && styles.buttonActive]}
              onPress={handleHidupkanTracer}
              disabled={tracerActive || activatingTracer}
            >
              <View style={styles.buttonContent}>
                {activatingTracer ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="cube-outline" size={25} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {activatingTracer ? "Mengaktifkan..." : tracerActive ? "Tracer Hidup" : "Hidupkan Tracer"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleSelesaikanPengiriman}
              disabled={navigatingComplete}
            >
              <View style={styles.buttonSecondaryContent}>
                {navigatingComplete ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
                <Text style={styles.buttonTextSecondary}>
                  {navigatingComplete ? "Membuka..." : "Selesaikan Pengiriman"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    backgroundColor: "#f9f9f9",
  },
  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 16,
    marginHorizontal: -16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    bottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 2,
    paddingBottom: 32,
    alignItems: "center",
    gap: 16,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: "#4CAF50",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  dataText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    backgroundColor: "#d3efde",
    borderRadius: 16,
    borderColor: "#29C9A4",
    borderWidth: 1,
    padding: 20,
    width: "100%",
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 55,
    height: 55,
    backgroundColor: "#158079",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  scanSuccessText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  dataPengirimanText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#158079",
  },
  scanSuccessTextHeader: {
    fontSize: 16,
    color: "#333333",
    opacity: 1,
  },
  dataPengirimanTextHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 4,
  },

  // CARD 2-4: Data Cards
  dataCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderColor: "#44444433",
    borderWidth: 1,
    padding: 20,
    width: "100%",
  },
  dataValue: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  statusValue: {
    fontSize: 18,
    color: "#000000",
    fontWeight: "bold",
  },

  // CARD 5: Action Card
  actionCard: {
    width: "100%",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: "#ced8de",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonTextSecondary: {
    color: "#3D3D3D",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12, // jarak antara icon dan teks
  },
  buttonSecondaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10, // jarak antara panah > dan teks
  },
  arrowText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  primaryButton: {
    backgroundColor: "#ced8de",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  primaryButtonText: {
    color: "#3D3D3D",
    fontWeight: "bold",
    fontSize: 16,
  },
});
