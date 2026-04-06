// app/pengiriman/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
  date_no_travel_document: string;
  send_to: string;
  project: string;
  status: string;
  po_number?: string;
  reference_number?: string;
  items?: any[];
};

export default function ProsesScreen() {
  const [data, setData] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/travel-documents");
      if (res?.data && Array.isArray(res.data)) {
        const filteredAndSorted = res.data
          .filter((item: TravelDocument) => {
            const status = (item.status || "").toString().trim().toLowerCase();
            return status === "sedang dikirim";
          })
          .sort(
            (a: TravelDocument, b: TravelDocument) =>
              new Date(b.date_no_travel_document).getTime() -
              new Date(a.date_no_travel_document).getTime(),
          );

        setData(filteredAndSorted);
      } else {
        setData([]);
      }
    } catch (e: any) {
      console.error("Error fetching proses data:", e);

      if (e?.status === 401) {
        Alert.alert("Sesi Habis", "Silakan login ulang.", [
          {
            text: "OK",
            onPress: async () => {
              await AsyncStorage.multiRemove(["token", "user", "role", "division"]);
              router.replace("/login");
            },
          },
        ]);
      }

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const statusIcon = require("@/assets/icons/sedang-dikirim.png");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const keyword = search.toLowerCase();
    return data.filter(
      (item) =>
        item.project.toLowerCase().includes(keyword) ||
        item.no_travel_document.toLowerCase().includes(keyword) ||
        item.send_to.toLowerCase().includes(keyword),
    );
  }, [data, search]);

  const renderItem = ({ item }: { item: TravelDocument }) => (
    <TouchableOpacity
      style={styles.recentCard}
      activeOpacity={0.85}
      onPress={() => {
        router.push({
          pathname: "/pengiriman/selesai",
          params: {
            id: item.id,
            no: item.no_travel_document,
            send_to: item.send_to,
            project: item.project,
            status: item.status,
            date: String(item.date_no_travel_document || ""),
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
        <Image source={statusIcon} style={styles.recentStatusIcon} />
      </View>

      <View style={styles.middleContent}>
        <Text style={styles.projectTitle}>{item.project}</Text>
        <Text style={styles.docNumber}>{item.no_travel_document}</Text>
        <Text style={styles.sendTo}>{item.send_to}</Text>
        <Text style={styles.dateText}>
          {formatDate(item.date_no_travel_document)}
        </Text>
      </View>

      <View style={styles.rightContent}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Sedang Dikirim</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Sedang Dikirim</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Cari proyek atau nomor SJN"
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
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator
                size="large"
                color="#1E3A8A"
                style={{ marginTop: 40 }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="hourglass-outline" size={60} color="#999" />
                <Text style={styles.emptyText}>
                  {search.trim()
                    ? "Tidak ditemukan pengiriman dalam proses"
                    : "Belum ada pengiriman yang sedang dalam proses"}
                </Text>
              </View>
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
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  recentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recentIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  recentStatusIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  middleContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  docNumber: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  sendTo: {
    fontSize: 13,
    color: "#888",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  rightContent: {
    alignItems: "flex-end",
  },
  statusBadge: {
    backgroundColor: "#48ABF7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
