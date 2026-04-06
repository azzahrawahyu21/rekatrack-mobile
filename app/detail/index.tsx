// app/detail/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Unit = {
  id: number;
  name: string;
};

type Item = {
  id?: number;
  item_code: string;
  item_name: string;
  qty_send: number | string;
  total_send?: number | string;
  qty_po?: number | string;
  unit_id: number;
  description?: string;
  information?: string;
  unit?: Unit;
};

type TravelDocument = {
  id: number;
  no_travel_document: string;
  // date_no_travel_document: string;
  posting_date: string;
  document_date?: string;
  send_to: string;
  project: string;
  status: string;
  po_number?: string;
  reference_number?: string;
  // Items sudah ada di response detail
  items?: Item[];
};

export default function DetailScreen() {
  const params = useLocalSearchParams();
  const [openingScan, setOpeningScan] = useState(false);

  // Ambil items langsung dari params (karena sudah di-load di API detail)
  const items: Item[] = params.items ? JSON.parse(String(params.items)) : [];

  const travelId = Number(params.id);

  const data: TravelDocument[] = [
    {
      id: travelId,
      no_travel_document: String(params.no ?? ""),
      send_to: String(params.send_to ?? "-"),
      project: String(params.project ?? "-"),
      status: String(params.status ?? "-"),
      // date_no_travel_document:
      //   typeof params.date === "string" ? params.date : "",
      posting_date: String(params.posting_date ?? ""),
      document_date: String(params.document_date ?? ""),
      po_number: String(params.po_number ?? "-"),
      reference_number: String(params.reference_number ?? "-"),
      items: items,
    },
  ];

  // const formatDate = (date: string) => {
  //   if (!date) return "-";
  //   return new Date(date).toLocaleDateString("id-ID", {
  //     day: "2-digit",
  //     month: "long",
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
        return "#FFEDD5"; // background orange soft
      case "Sedang dikirim":
        return "#48ABF7"; // background biru
      case "Terkirim":
        return "#DCFCE7"; // background hijau soft
      default:
        return "#E5E7EB"; // fallback abu-abu
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "Belum terkirim":
        return "#C4541F"; // teks orange tua
      case "Sedang dikirim":
        return "#FFFFFF"; // teks putih
      case "Terkirim":
        return "#158079"; // teks hijau tua
      default:
        return "#4B5563";
    }
  };

  const renderRecentItem = ({ item }: { item: TravelDocument }) => (
    <>
      {/* CARD DETAIL SJN (ATAS) */}
      <View style={styles.detailCard}>
        {/* SJN */}
        <View style={styles.sjnRow}>
          <View style={styles.iconBox}>
            <Ionicons name="cube-outline" size={30} color="#1e90ff" />
          </View>
          <View>
            <Text style={styles.label}>SJN Number</Text>
            <Text style={styles.sjnText}>{item.no_travel_document}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* DETAIL */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Kepada</Text>
            <Text style={styles.value}>{item.send_to}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Tanggal Dokumen</Text>
            <Text style={styles.value}>{formatDate(item.document_date)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Proyek</Text>
            <Text style={styles.value}>{item.project}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Tanggal Posting</Text>
            <Text style={styles.value}>{formatDate(item.posting_date)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>PO</Text>
            <Text style={styles.value}>{item.po_number || "-"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Ref</Text>
            <Text style={styles.value}>{item.reference_number || "-"}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Status</Text>
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
          {item.status === "Sedang dikirim" && (
            <View style={styles.col}>
              <Text style={styles.label}>Aksi</Text>

              {/* SEDANG DIKIRIM */}
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/pengiriman/selesai",
                    params: {
                      id: String(item.id),
                      no: item.no_travel_document,
                      send_to: item.send_to,
                      project: item.project,
                    },
                  });
                }}
                style={[styles.actionButton, { backgroundColor: "#364981" }]}
              >
                <Text style={styles.actionButtonText}>Selesaikan Pengiriman</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* JUDUL DAFTAR BARANG */}
      <Text style={styles.sectionTitleOuter}>Daftar Barang</Text>

      {/* KOSONGKAN JIKA TIDAK ADA BARANG */}
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Tidak ada barang</Text>
      ) : (
        /* DAFTAR CARD BARANG TERPISAH */
        <View style={styles.itemsListContainer}>
          {items.map((it, index) => (
            <View key={it.id || index} style={styles.itemSeparateCard}>
              {/* Header: Nomor + Nama + Kode */}
              <View style={styles.itemSeparateHeader}>
                <Text style={styles.itemSeparateIndex}>{index + 1}.</Text>
                <View style={styles.itemSeparateNameContainer}>
                  <Text style={styles.itemSeparateName}>
                    {it.item_name || "-"}
                  </Text>
                  <Text style={styles.itemSeparateCode}>
                    Kode: {it.item_code || "-"}
                  </Text>
                  {it.information && (
                    <Text style={styles.itemInfoText}>
                      Informasi: {it.information}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.itemSeparateDivider} />

              <View style={styles.itemQtyGrid}>
                <View style={styles.itemQtyCol}>
                  <Text style={styles.detailLabel}>Qty Kirim</Text>
                  <Text style={styles.detailValue}>
                    {it.qty_send} {it.unit?.name || ""}
                  </Text>
                </View>

                {it.qty_po !== undefined && it.qty_po !== null && (
                  <View style={styles.itemQtyCol}>
                    <Text style={styles.detailLabel}>Qty PO</Text>
                    <Text style={styles.detailValue}>{it.qty_po}</Text>
                  </View>
                )}

                {it.total_send !== undefined && it.total_send !== null && (
                  <View style={styles.itemQtyCol}>
                    <Text style={styles.detailLabel}>Total Kirim</Text>
                    <Text style={styles.detailValue}>{it.total_send}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </>
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
          <Text style={styles.title}>Detail Pengiriman</Text>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecentItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 50,
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
  },
  label: {
    fontSize: 14,
    color: "#777",
    marginTop: 7,
  },
  labelBarang: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  itemCodeContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  sjnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#EAF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sjnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    width: "48%",
  },
  colFull: {
    width: "100%",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  actionButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "#364981",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemIndex: {
    fontSize: 15,
    color: "#666",
    marginRight: 8,
    fontWeight: "600",
  },
  itemCodeName: {
    flex: 1,
  },
  itemCode: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  itemDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  itemDetailCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: "#777",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  itemDescriptionText: {
    fontSize: 14,
    color: "#444",
    marginTop: 8,
    fontStyle: "italic",
  },
  itemInfoText: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
  sectionTitleOuter: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  itemsListContainer: {
    gap: 12,
  },
  itemSeparateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  itemSeparateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemSeparateIndex: {
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
    marginRight: 12,
    minWidth: 30,
  },
  itemSeparateNameContainer: {
    flex: 1,
  },
  itemSeparateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  itemSeparateCode: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
  },
  itemSeparateDescription: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
    fontStyle: "italic",
  },
  itemSeparateDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  itemQtyGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemQtyCol: {
    flex: 1,
    alignItems: "center",
  },
});
