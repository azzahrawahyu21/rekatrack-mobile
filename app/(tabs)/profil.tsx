// app/(tabs)/profil.tsx

import { apiFetch } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type User = {
  nip: string;
  name: string;
  email: string;
  phone_number: string | null;
  avatar: string | null;
  role_id: number;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setAvatarUri(parsed.avatar || null);
      }

      await fetchLatestProfile();
    } catch (error) {
      console.error('Gagal load user:', error);
      Alert.alert('Error', 'Gagal memuat data profil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const fetchLatestProfile = async () => {
    try {
      const response = await apiFetch('/user');
      if (response && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        setAvatarUri(updatedUser.avatar || null);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.warn('Gagal sync profil:', error);
      if (error?.status === 401) {
        Alert.alert('Sesi Kadaluarsa', 'Silakan login ulang.');
        await AsyncStorage.multiRemove(['user', 'token']);
        router.replace('/login');
      }
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Izin Ditolak', 'Izinkan akses galeri untuk mengganti foto profil');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setAvatarUri(selectedImage);

      // Update lokal di user & AsyncStorage (biar persist setelah reload)
      if (user) {
        const updatedUser = { ...user, avatar: selectedImage };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      Alert.alert('Sukses', 'Foto profil berhasil diganti!');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Apakah kamu yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Hapus semua data login
              await AsyncStorage.multiRemove(['user', 'token', 'role', 'division']);

              // Redirect ke halaman login
              router.replace('/login');
            } catch (error) {
              console.error('Gagal logout:', error);
              Alert.alert('Error', 'Gagal logout, coba lagi');
            }
          },
        },
      ]
    );
  };


  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadUserData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#386BF6" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* CUSTOM HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* KONTEN PROFIL */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1E3A8A"]}
              tintColor="#1E3A8A"
            />
          }
        >
          {/* Foto Profil */}
          <View style={styles.profileSection}>
            <View style={styles.photoWrapper}>
              {avatarUri || user?.avatar ? (
                <Image
                  source={{ uri: avatarUri || user?.avatar || 'https://via.placeholder.com/150?text=User' }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <Ionicons name="person" size={60} color="#999" />
                </View>
              )}

              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* <Text style={styles.changePhotoText}>Ubah Foto Profil</Text> */}
          </View>

          {/* Detail Profil (Read-only) */}
          <View style={styles.formCard}>
            <Text style={styles.label}>NIP</Text>
            <Text style={styles.readOnlyText}>{user?.nip || '-'}</Text>

            <Text style={styles.label}>Nama</Text>
            <Text style={styles.readOnlyText}>{user?.name || '-'}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.readOnlyText}>{user?.email || '-'}</Text>

            <Text style={styles.label}>Nomor Telepon</Text>
            <Text style={styles.readOnlyText}>{user?.phone_number || '-'}</Text>
          </View>

          {/* Tombol Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 50,
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
    marginTop: 15,
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#386BF6',
    padding: 10,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
  },
  // changePhotoText: {
  //   fontSize: 16,
  //   color: '#333',
  //   fontWeight: '600',
  // },
  formCard: {
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    borderRadius: 12,
    marginBottom: 16,
    paddingBottom: 5,
    paddingTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  logoutButton: {
    marginHorizontal: 10,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});