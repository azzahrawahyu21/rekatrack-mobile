// app/pengiriman/selesai.tsx

import { apiFetch } from "@/utils/api";
import { LOCATION_TASK_NAME } from "@/utils/locationTask";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Params = {
  id: string;
  no: string;
  send_to: string;
  project: string;
};

export default function KonfirmasiSelesaiScreen() {
  const params = useLocalSearchParams<Params>();

  const [namaPenerima, setNamaPenerima] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPhotoOption, setShowPhotoOption] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
    if (Platform.OS === "android") setShowTimePicker(true);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || date;
    setShowTimePicker(Platform.OS === "ios");
    setDate(currentTime);
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") throw new Error("Izin lokasi ditolak");

    const loc = await Location.getCurrentPositionAsync({});
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  };

  /**
   * Normalize asset (kamera/galeri) jadi JPEG file://...
   * Ini akan mengatasi HEIC/HEIF iOS dan content:// Android.
   */
  const normalizeToJpegFile = async (asset: ImagePicker.ImagePickerAsset) => {
    const srcUri = asset.uri;

    const resizeActions: ImageManipulator.Action[] = [];
    const maxDimension = Math.max(asset.width ?? 0, asset.height ?? 0);

    if (maxDimension > 1600) {
      if ((asset.width ?? 0) >= (asset.height ?? 0)) {
        resizeActions.push({ resize: { width: 1600 } });
      } else {
        resizeActions.push({ resize: { height: 1600 } });
      }
    }

    // convert ke jpeg dan resize opsional supaya upload iOS lebih stabil
    const out = await ImageManipulator.manipulateAsync(srcUri, resizeActions, {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    if (!out?.uri) throw new Error("Gagal menghasilkan file jpeg");

    console.log("SRC URI:", srcUri);
    console.log("OUT URI:", out.uri);

    return out.uri;
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Izin ditolak",
        "Akses galeri diperlukan untuk mengunggah foto",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      const normalizedImages = await Promise.all(
        result.assets.map((asset) => normalizeToJpegFile(asset)),
      );

      setSelectedImages((prev) => {
        const merged = [...prev, ...normalizedImages];
        return [...new Set(merged)];
      });
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Izin kamera dibutuhkan",
          "Aktifkan akses kamera di Settings agar bisa ambil foto bukti pengiriman.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
        exif: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const jpegUri = await normalizeToJpegFile(asset);
        setSelectedImages((prev) => [...prev, jpegUri]);
      }
    } catch (error) {
      console.error("TAKE PHOTO ERROR:", error);
      Alert.alert(
        "Kamera gagal dibuka",
        "Terjadi kendala saat membuka kamera. Coba tutup aplikasi lalu buka kembali.",
      );
    }
  };

  /**
   * Upload photo sebagai multipart.
   * Penting:
   * - Jangan set Content-Type manual
   * - URI harus file://...
   */
  const uploadPhotos = async () => {
    if (selectedImages.length === 0) throw new Error("Foto belum dipilih");

    const uploadedPhotoPaths = await Promise.all(
      selectedImages.map(async (imageUri, index) => {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists || (fileInfo.size ?? 0) <= 0) {
          throw new Error(`File foto ke-${index + 1} tidak valid. Coba ambil ulang foto.`);
        }

        const filenameFromUri =
          imageUri.split("/").pop() || `delivery-${Date.now()}-${index + 1}.jpg`;

        const formData = new FormData();
        formData.append("photo", {
          uri: imageUri,
          name: filenameFromUri,
          type: "image/jpeg",
        } as any);

        const res = await apiFetch("/upload-delivery-photo", {
          method: "POST",
          body: formData,
        });

        if (!res?.photo_path) {
          throw new Error("Response upload tidak mengandung photo_path");
        }

        return res.photo_path as string;
      }),
    );

    return uploadedPhotoPaths;
  };

  const removeImage = (imageUri: string) => {
    setSelectedImages((prev) => prev.filter((uri) => uri !== imageUri));
  };

  const handleKonfirmasi = async () => {
    if (!namaPenerima.trim())
      return Alert.alert("Error", "Nama penerima wajib diisi");
    if (selectedImages.length === 0)
      return Alert.alert("Error", "Foto bukti penerimaan wajib diunggah");

    setLoading(true);

    // guard biar nggak loading selamanya
    const hardTimeout = setTimeout(() => {
      setLoading(false);
      Alert.alert("Timeout", "Proses terlalu lama. Coba lagi.");
    }, 25000);

    try {
      const { latitude, longitude } = await getCurrentLocation();

      // 1) upload photo
      const photoPaths = await uploadPhotos();

      // 2) complete tracking
      await apiFetch("/complete-tracking", {
        method: "POST",
        body: JSON.stringify({
          travel_document_id: [Number(params.id)],
          latitude,
          longitude,
          receiver_name: namaPenerima,
          received_at: date.toISOString(),
          note: catatan,
          photo_path: photoPaths[0],
          photo_paths: photoPaths,
        }),
      });

      const isTrackingRunning = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME,
      );
      if (isTrackingRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      await AsyncStorage.removeItem("ACTIVE_SJN_ID");

      clearTimeout(hardTimeout);
      Alert.alert("Sukses", "Pengiriman berhasil diselesaikan!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e: any) {
      clearTimeout(hardTimeout);
      console.error("KONFIRM ERROR:", e);
      Alert.alert("Error", e?.message || "Gagal menyelesaikan pengiriman");
    } finally {
      clearTimeout(hardTimeout);
      setLoading(false);
    }
  };

  const formatDateTime = (d: Date) => {
    return (
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }) +
      " " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  };

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
          <Text style={styles.title}>Selesaikan Pengiriman</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" style={styles.warningIcon} />
            <Text style={styles.warningTitle}>Konfirmasi Penyelesaian</Text>
            <Text style={styles.warningSubtitle}>
              Pastikan paket telah diterima dengan baik oleh penerima
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Ringkasan Pengiriman</Text>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Nomor SJN</Text>
              <Text style={styles.value}>{params.no || "-"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Proyek</Text>
              <Text style={styles.value}>{params.project || "-"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Penerima</Text>
              <Text style={styles.value}>{params.send_to || "-"}</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Detail Penerima</Text>
            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Nama Penerima</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukan nama penerima"
              value={namaPenerima}
              onChangeText={setNamaPenerima}
            />

            <Text style={styles.inputLabel}>Waktu Penerimaan</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{formatDateTime(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={onDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                onChange={onTimeChange}
              />
            )}

            <Text style={styles.inputLabel}>Catatan (Opsional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Masukan catatan jika diperlukan"
              value={catatan}
              onChangeText={setCatatan}
              multiline
            />

            <Text style={styles.inputLabel}>Foto Bukti Penerimaan</Text>
            <TouchableOpacity style={styles.photoBox} onPress={() => setShowPhotoOption(true)}>
              {selectedImages.length > 0 ? (
                <>
                  <FlatList
                    data={selectedImages}
                    horizontal
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoList}
                    renderItem={({ item }) => (
                      <View style={styles.photoItem}>
                        <Image source={{ uri: item }} style={styles.photoPreview} />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={() => removeImage(item)}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  <Text style={styles.photoCountText}>{selectedImages.length} foto dipilih</Text>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="add-circle-outline" size={40} color="#999" />
                  <Text style={styles.photoText}>Klik untuk unggah foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.disabledButton]}
            onPress={handleKonfirmasi}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Konfirmasi Selesai</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Batal</Text>
          </TouchableOpacity>
        </ScrollView>

        {showPhotoOption && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Upload Foto</Text>
              <Text style={styles.modalSubtitle}>
                Ambil foto bukti penerimaan
              </Text>

              <TouchableOpacity
                style={[styles.modalButton, styles.cameraButton]}
                onPress={() => {
                  setShowPhotoOption(false);
                  takePhoto();
                }}
              >
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Kamera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.galleryButton]}
                onPress={() => {
                  setShowPhotoOption(false);
                  pickImage();
                }}
              >
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Galeri (bisa pilih banyak)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowPhotoOption(false)}
              >
                <Text style={styles.cancelTextModal}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30, backgroundColor: "#f9f9f9" },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 16,
    marginHorizontal: -16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: { position: "absolute", left: 16, bottom: 16, paddingLeft: 16 },
  title: { fontSize: 18, fontWeight: "600", color: "#333" },

  warningBanner: {
    backgroundColor: "#FFF8E1",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFCC80",
  },
  warningIcon: {
    width: 50,
    height: 50,
    color: "#FFFFFF",
    backgroundColor: "#FF9437",
    borderRadius: 25,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 30,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginTop: 12,
    marginBottom: 8,
  },
  warningSubtitle: { fontSize: 14, color: "#666", textAlign: "center" },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 14, color: "#666" },
  value: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#eee",
  },
  inputLabel: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  multilineInput: { height: 100, textAlignVertical: "top", marginBottom: 12 },

  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  photoBox: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 16,
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 12,
  },
  photoList: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  photoItem: {
    width: 120,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
    position: "relative",
  },
  photoPreview: { width: "100%", height: "100%" },
  removePhotoButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCountText: {
    marginTop: 10,
    marginBottom: 4,
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  photoPlaceholder: { alignItems: "center" },
  photoText: { marginTop: 10, color: "#999", fontSize: 14 },

  confirmButton: {
    backgroundColor: "#1580F5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.7 },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  cancelButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  cancelText: { color: "#666", fontSize: 16, fontWeight: "bold" },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },

  modalButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cameraButton: { backgroundColor: "#1580F5" },
  galleryButton: { backgroundColor: "#2E7D32" },
  cancelModalButton: { backgroundColor: "#E0E0E0" },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelTextModal: { color: "#333", fontSize: 16, fontWeight: "600" },
});
