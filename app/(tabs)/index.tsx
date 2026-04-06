import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { apiFetch } from "@/utils/api";
import { StatusBar } from "expo-status-bar";

type TravelDocument = {
  id: number;
  no_travel_document: string;
  // date_no_travel_document: string;
  posting_date: string; // ← tambahkan ini
  document_date?: string; // ← opsional jika tidak selalu ada
  send_to: string;
  project: string;
  status: string;
  po_number?: string;
  reference_number?: string;
  items?: any[];
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [allDocuments, setAllDocuments] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [recentItems, setRecentItems] = useState<TravelDocument[]>([]);
  const [userName, setUserName] = useState<string>("User"); // untuk nama user
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    belumTerkirim: 0,
    sedangDikirim: 0,
    terkirim: 0,
    history: 0,
  });
  const backPressed = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        const now = Date.now();
        if (backPressed.current === 0 || now - backPressed.current > 2000) {
          backPressed.current = now;

          ToastAndroid.show(
            "Tekan sekali lagi untuk keluar",
            ToastAndroid.SHORT,
          );
          return true;
        }

        BackHandler.exitApp();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => {
        backHandler.remove();
      };
    }, []),
  );

  // Ambil nama user dari AsyncStorage saat komponen dimuat
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name || "User");
        }
      } catch (e) {
        console.warn("Gagal memuat data user:", e);
      }
    };

    loadUserData();

    return () => {
      // backHandler.remove();
    };
  }, []);

  const fetchTravelDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/travel-documents");

      if (response && Array.isArray(response.data)) {
        // const sorted = [...response.data].sort((a, b) => {
        //   const dateA = a.date_no_travel_document
        //     ? new Date(a.date_no_travel_document.replace(" ", "T")).getTime()
        //     : 0;

        //   const dateB = b.date_no_travel_document
        //     ? new Date(b.date_no_travel_document.replace(" ", "T")).getTime()
        //     : 0;

        //   return dateB - dateA; // DESC → terbaru di atas
        // });
        const sorted = [...response.data].sort((a, b) => {
          const dateA = a.posting_date ? new Date(a.posting_date).getTime() : 0;
          const dateB = b.posting_date ? new Date(b.posting_date).getTime() : 0;
          return dateB - dateA; // DESC → terbaru dulu
        });

        setAllDocuments(sorted);

        const belumTerkirim = sorted.filter(
          (d) => d.status === "Belum terkirim",
        ).length;
        const sedangDikirim = sorted.filter(
          (d) => d.status === "Sedang dikirim",
        ).length;
        const terkirim = sorted.filter((d) => d.status === "Terkirim").length;

        setStats({
          belumTerkirim,
          sedangDikirim,
          terkirim,
          history: sorted.length,
        });

        setRecentItems(sorted.slice(0, 3));
        // setRecentItems(recent);
      } else {
        setError("Format data tidak valid");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      const errorMsg = err?.message || "Gagal memuat data";

      if (err?.status === 401) {
        Alert.alert("Sesi Habis", "Silakan login ulang.", [
          {
            text: "OK",
            onPress: () => {
              AsyncStorage.removeItem("token");
              AsyncStorage.removeItem("user");
              // Jika Anda punya router:
              // router.replace('/login');
            },
          },
        ]);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTravelDocuments();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTravelDocuments();
  }, []);

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString("id-ID", {
  //     day: "2-digit",
  //     month: "short",
  //     year: "numeric",
  //   });
  // };
  const formatDate = (date?: string) => {
    if (!date || date.trim() === "") {
      return "—";
    }
    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return "—";
      return parsed.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Belum terkirim":
        return "#FFEDD5";
      case "Sedang dikirim":
        return "#48ABF7";
      case "Terkirim":
        return "#DCFCE7";
      default:
        return "#E5E7EB";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "Belum terkirim":
        return "#C4541F";
      case "Sedang dikirim":
        return "#FFFFFF";
      case "Terkirim":
        return "#158079";
      default:
        return "#4B5563";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Belum terkirim":
        return require("@/assets/icons/pending.png");
      case "Sedang dikirim":
        return require("@/assets/icons/sedang-dikirim.png");
      case "Terkirim":
        return require("@/assets/icons/sent.png");
      default:
        return require("@/assets/icons/pending.png");
    }
  };

  const renderRecentItem = ({ item }: { item: TravelDocument }) => (
    <TouchableOpacity
      style={styles.recentCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/detail",
          params: {
            id: item.id,
            no: item.no_travel_document,
            send_to: item.send_to,
            project: item.project,
            status: item.status,
            // date: item.date_no_travel_document
            //   ? String(item.date_no_travel_document)
            //   : "",
            posting_date: item.posting_date || "", // ← tambah ini
            document_date: item.document_date || "", // ← tambah ini
            po_number: item.po_number ? String(item.po_number) : "",
            reference_number: item.reference_number
              ? String(item.reference_number)
              : "",
            items: JSON.stringify(item.items || []),
          },
        })
      }
    >
      <View style={styles.recentIconWrapper}>
        <Image
          source={getStatusIcon(item.status)}
          style={styles.recentStatusIcon}
        />
      </View>

      <View style={styles.middleContent}>
        <Text style={styles.projectTitle}>{item.project}</Text>
        <Text style={styles.docNumber}>{item.no_travel_document}</Text>
        <Text style={styles.sendTo}>{item.send_to}</Text>
        <Text style={styles.dateText}>{formatDate(item.document_date)}</Text>
      </View>

      <View style={styles.rightContent}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusTextColor(item.status) },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // const handleTrack = () => {
  //   if (!trackingInput.trim()) {
  //     Alert.alert('Error', 'Masukkan nomor SJN');
  //     return;
  //   }
  //   Alert.alert('Track', `Mencari: ${trackingInput}`);
  // };

  const handleTrack = () => {
    const input = trackingInput.trim();

    if (!input) {
      Alert.alert("Error", "Masukkan nomor SJN");
      return;
    }

    // Cari dokumen berdasarkan no_travel_document
    const foundDocument = allDocuments.find(
      (doc) => doc.no_travel_document.toLowerCase() === input.toLowerCase(),
    );

    if (!foundDocument) {
      Alert.alert("Tidak Ditemukan", `Nomor SJN "${input}" tidak ditemukan.`);
      return;
    }

    // Jika ditemukan, langsung navigasi ke halaman detail
    router.push({
      pathname: "/detail",
      params: {
        id: foundDocument.id.toString(),
        no: foundDocument.no_travel_document,
        send_to: foundDocument.send_to,
        project: foundDocument.project,
        status: foundDocument.status,
        // date: foundDocument.date_no_travel_document || "",
        posting_date: foundDocument.posting_date || "", // ← ubah ke ini
        document_date: foundDocument.document_date || "",
        po_number: foundDocument.po_number || "",
        reference_number: foundDocument.reference_number || "",
        items: JSON.stringify(foundDocument.items || []),
      },
    });

    // Optional: kosongkan input setelah berhasil track
    setTrackingInput("");
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchTravelDocuments}>
          <Text style={styles.retryText}>Coba lagi</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor="#f9f9f9"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1E3A8A"]}
            tintColor="#1E3A8A"
            progressViewOffset={10}
          />
        }
      >
        {/* Header   */}
        <View style={styles.header}>
          <View style={styles.headerTextRow}>
            <Text style={styles.welcomeText}>Halo, {userName}</Text>
          </View>

          <View style={styles.headerLogo}>
            <Image
              style={styles.logo}
              source={require("@/assets/images/logo.mobile.png")}
            />
          </View>
        </View>

        <Text style={styles.subtitle}>Pantau dan kelola pengiriman Anda</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard]}
            onPress={() =>
              router.push({
                pathname: "/detail/viewall",
                params: { filterStatus: "Belum terkirim" },
              })
            }
          >
            <View style={styles.iconWrapper}>
              <Image
                style={styles.statIcon}
                source={require("@/assets/icons/belum-terkirim.png")}
              />
            </View>

            <Text style={styles.statNumber}>{stats.belumTerkirim}</Text>
            <Text style={styles.statLabel}>Belum Terkirim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard]}
            onPress={() =>
              router.push({
                pathname: "/detail/viewall",
                params: { filterStatus: "Terkirim" },
              })
            }
          >
            <View style={styles.iconWrapper}>
              <Image
                style={styles.statIcon}
                source={require("@/assets/icons/terkirim.png")}
              />
            </View>

            <Text style={styles.statNumber}>{stats.terkirim}</Text>
            <Text style={styles.statLabel}>Terkirim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard]}
            onPress={() => router.push("/pengiriman")}
          >
            <View style={styles.iconWrapper}>
              <Image
                style={styles.statIcon}
                source={require("@/assets/icons/history.png")}
              />
            </View>

            <Text style={styles.statNumber}>{stats.sedangDikirim}</Text>
            <Text style={styles.statLabel}>Sedang Dikirim</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Track */}
        <View style={styles.quickTrack}>
          <Text style={styles.quickTrackTitle}>Lacak Cepat</Text>
          <Text style={styles.quickTrackSubtitle}>Masukkan Nomor SJN</Text>
          <View style={styles.trackInputContainer}>
            <TextInput
              style={styles.trackInput}
              placeholder="Nomor Surat Jalan (SJN)"
              value={trackingInput}
              onChangeText={setTrackingInput}
              placeholderTextColor="#FFFFFF"
            />
            <TouchableOpacity style={styles.trackButton} onPress={handleTrack}>
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Tracking */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pengiriman Terbaru</Text>
          <TouchableOpacity onPress={() => router.push("/detail/viewall")}>
            <Text style={styles.viewAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {recentItems.map((item) => (
          <View key={item.id}>{renderRecentItem({ item })}</View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 45,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 10,
  },
  headerTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    paddingBottom: 5,
  },
  logo: {
    width: 70,
    height: 30,
    resizeMode: "contain",
    marginRight: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#2B7FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#2B7FFF",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#666666",
    fontWeight: "bold",
  },
  quickTrack: {
    backgroundColor: "#364981",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  quickTrackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  quickTrackSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  trackInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackInput: {
    flex: 1,
    backgroundColor: "#506191",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: "#FFFFFF",
  },
  trackButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAll: {
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  recentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  recentContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 95,
    marginLeft: 8,
    alignItems: "center",
  },
  statusText: {
    // color: '#fff',
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  arrow: {
    fontSize: 18,
    color: "#888",
  },
  listContainer: {
    paddingBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    textAlign: "center",
    color: "#666",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  retryText: {
    color: "#1E3A8A",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
  },
  welcomeTextBold: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  welcomeSmall: {
    fontSize: 12,
    color: "#555",
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recentIconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  recentStatusIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  middleContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  sendTo: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  sendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
