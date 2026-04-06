// app/pengiriman/detail.tsx

import { apiFetch } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type DetailData = {
  id: number;
  no_travel_document: string;
  send_to: string;
  project: string;
  date_no_travel_document: string;
  po_number?: string;
  reference_number?: string;
  start_time?: string; // ← tambah ini
};

export default function DetailPengirimanScreen() {
  const params = useLocalSearchParams<{
    id: string;
    no: string;
    send_to: string;
    project: string;
    date: string;
    po_number?: string;
    reference_number?: string;
  }>();

  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const response = await apiFetch(`/travel-document/${params.id}`);
      if (response?.data) {
        setDetail(response.data);
      }
    } catch {
      Alert.alert('Error', 'Gagal memuat detail pengiriman');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Fetch detail lengkap dari API
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);


//   const handleSelesaikanPengiriman = async () => {
//     setLoadingLocation(true);
//     const location = await getLocation();
//     if (!location) {
//       setLoadingLocation(false);
//       return;
//     }

//     try {
//       await apiFetch('/complete-tracking', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           travel_document_id: [parseInt(params.id)],
//           latitude: location.latitude,
//           longitude: location.longitude,
//         }),
//       });

//       router.push({
//         pathname: '/pengiriman/selesai',
//         params: {
//           no: params.no,
//           project: params.project,
//           send_to: params.send_to,
//         },
//       });
//     } catch (error) {
//       Alert.alert('Error', 'Gagal menyelesaikan pengiriman');
//     } finally {
//       setLoadingLocation(false);
//     }
//   };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDetail();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelesaikanPengiriman = () => {
      router.push({
          pathname: '/pengiriman/selesai',
          params: {
          id: params.id, // penting untuk API nanti
          no: detail?.no_travel_document || params.no,
          send_to: detail?.send_to || params.send_to,
          project: detail?.project || params.project,
          date: detail?.date_no_travel_document || params.date,
          },
      });
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#158079" />
        <Text>Memuat detail...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Tracer Aktif</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E3A8A"]}
              tintColor="#1E3A8A"
            />
          }
        >
          <View style={styles.successSection}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={80} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Tracker Diaktifkan!</Text>
            <Text style={styles.successSubtitle}>
              Status pengiriman sekarang dapat diakses secara real-time
            </Text>
          </View>

          <View style={styles.mainCard}>
            {/* Nomor SJN + Active */}
            <View style={styles.sjnSection}>
              <View>
                <Text style={styles.sjnLabel}>Nomor SJN</Text>
                <Text style={styles.sjnNumber}>{detail?.no_travel_document || params.no || '-'}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Status & Waktu Aktivasi (dari start_time) */}
            <View style={styles.rowSection}>
              <View style={styles.rowItemLeft}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.label}>Waktu Aktivasi</Text>
              </View>
              <View style={styles.rowItemRight}>
                <Text style={styles.valueRight}>Sedang Dikirim</Text>
                <Text style={styles.valueRight}>{formatDateTime(detail?.start_time)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 2 Kolom Data */}
            <View style={styles.twoColumnSection}>
              <View style={styles.column}>
                <Text style={styles.label}>Kepada</Text>
                <Text style={styles.valueBold}>{detail?.send_to || params.send_to || '-'}</Text>

                <Text style={styles.label}>Proyek</Text>
                <Text style={styles.valueBold}>{detail?.project || params.project || '-'}</Text>

                {detail?.po_number && (
                  <>
                    <Text style={styles.label}>PO</Text>
                    <Text style={styles.valueBold}>{detail.po_number}</Text>
                  </>
                )}
              </View>

              <View style={styles.column}>
                <Text style={styles.label}>Alamat</Text>
                <Text style={styles.valueBold}>{detail?.send_to || params.send_to || '-'}</Text>

                <Text style={styles.label}>Tanggal</Text>
                <Text style={styles.valueBold}>{formatDate(detail?.date_no_travel_document || params.date)}</Text>

                {detail?.reference_number && (
                  <>
                    <Text style={styles.label}>Ref</Text>
                    <Text style={styles.valueBold}>{detail.reference_number}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.primaryButtonText}>Kembali ke Dashboard</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSelesaikanPengiriman}
            disabled={loadingLocation}
          >
            <View style={styles.secondaryButtonContent}>
              {loadingLocation ? (
                <ActivityIndicator color="#666" size="small" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#666" />
              )}
              <Text style={styles.secondaryButtonText}>
                {loadingLocation ? 'Menyelesaikan...' : 'Selesaikan Pengiriman'}
              </Text>
            </View>
          </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSelesaikanPengiriman}
              >
              <View style={styles.secondaryButtonContent}>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                  <Text style={styles.secondaryButtonText}>Selesaikan Pengiriman</Text>
              </View>
            </TouchableOpacity>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Header & Container - SAMA PERSIS dengan index.tsx
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    marginHorizontal: -16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    paddingLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },

  // Success Section
  successSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  successCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#3CE496',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },

  // Main Card
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },

  // SJN Section
  sjnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sjnLabel: {
    fontSize: 14,
    color: '#666',
  },
  sjnNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#092F48',
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
  },
  activeText: {
    color: '#158079',
    fontSize: 13,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },

  // Row Section (Status & Waktu)
  rowSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowItemLeft: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 10,
  },
  rowItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueRight: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 12, // agar jarak antar baris sama
  },
  // Two Column Section
  twoColumnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  column: {
    flex: 1,
  },

  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
  valueBold: {
    fontSize: 15,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#1580F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#E8E8E8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});