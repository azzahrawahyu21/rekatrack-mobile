import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { apiFetch } from "@/utils/api";

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

export default function ViewAllScreen() {
  const [data, setData] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { filterStatus } = useLocalSearchParams();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/travel-documents");
      if (res?.data && Array.isArray(res.data)) {
        // Sort dari tanggal terbaru ke terlama berdasarkan posting_date
        const sortedData = [...res.data].sort((a, b) => {
          const dateA = a.posting_date ? new Date(a.posting_date).getTime() : 0;
          const dateB = b.posting_date ? new Date(b.posting_date).getTime() : 0;
          return dateB - dateA; // terbaru di atas
        });

        setData(sortedData);
      } else {
        setData([]);
      }
    } catch (e) {
      console.log("Error fetching data:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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

  // FILTER DATA BERDASARKAN SEARCH
  const filteredData = useMemo(() => {
    let result = data;

    // Filter berdasarkan status jika ada
    if (filterStatus && typeof filterStatus === "string") {
      result = result.filter((item) => item.status === filterStatus);
    }

    // Filter berdasarkan pencarian
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.project.toLowerCase().includes(keyword) ||
          item.no_travel_document.toLowerCase().includes(keyword),
      );
    }

    return result;
  }, [data, filterStatus, search]);


  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  const getTitle = () => {
    if (filterStatus === "Belum terkirim") return "Belum Terkirim";
    if (filterStatus === "Sedang dikirim") return "Sedang Dikirim";
    if (filterStatus === "Terkirim") return "Terkirim";
    return "Daftar Pengiriman";
  };

  const renderItem = ({ item }: { item: TravelDocument }) => (
    <TouchableOpacity
      style={styles.recentCard}
      activeOpacity={0.85}
      onPress={() => {
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
            posting_date: item.posting_date || "", // ← penting: kirim ke halaman detail
            document_date: item.document_date || "",
            po_number: item.po_number ? String(item.po_number) : "",
            reference_number: item.reference_number
              ? String(item.reference_number)
              : "",
            items: JSON.stringify(item.items || []),
          },
        });
      }}
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
        <Text style={styles.dateText}>
          {formatDate(item.posting_date || item.document_date || "")}
        </Text>
      </View>

      <View style={styles.rightContent}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          {/* <Text style={styles.statusText}> */}
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

  return (
    <>
      {/* HIDE HEADER BAWAAN */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
        </View>

        {/* Search tetap ada */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Cari nama atau nomor surat jalan"
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E3A8A"]}
              tintColor="#1E3A8A"
            />
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.emptyText}>
                {search.trim()
                  ? "Data tidak ditemukan"
                  : "Tidak ada data untuk status ini"}
              </Text>
            )
          }
        />
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
  /* HEADER */
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
  },
  /* SEARCH */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
  },
  /* CARD */
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
  projectTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  docNumber: {
    fontSize: 14,
    color: "#666",
  },
  sendTo: {
    fontSize: 12,
    color: "#777",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  rightContent: {
    alignItems: "flex-end",
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
});
