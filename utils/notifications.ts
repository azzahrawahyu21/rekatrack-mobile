import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { apiFetch } from './api';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Info', 'Push Notification hanya bisa di-test di HP fisik');
    return null;
  }

  try {
    // === Request Izin Notifikasi ===
    let { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      existingStatus = status;
    }

    if (existingStatus !== 'granted') {
      Alert.alert(
        'Izin Notifikasi Ditolak',
        'Silakan izinkan notifikasi di Pengaturan → Aplikasi → Notifikasi'
      );
      return null;
    }

    // === Ambil Project ID ===
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      (Constants?.expoConfig as any)?.projectId;

    if (!projectId) {
      console.warn('Project ID tidak ditemukan');
      Alert.alert('Error', 'Project ID tidak ditemukan. Coba rebuild aplikasi.');
      return null;
    }

    // === Dapatkan Token ===
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;

    console.log("✅ Expo Push Token:", token);

    // Kirim ke backend
    await apiFetch('/save-expo-token', {
      method: 'POST',
      body: JSON.stringify({ expo_token: token }),
    });

    console.log('✅ Token berhasil dikirim ke server');
    return token;

  } catch (error: any) {
    console.error("❌ Error Push Notification:", error);
    Alert.alert('Error', 'Gagal mendapatkan token:\n' + (error.message || error));
    return null;
  }
}

// === Listener Notifikasi ===
export function setupNotificationListeners() {
  // Foreground listener
  const receivedListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
    console.log('📩 Notifikasi diterima (foreground):', notification);
  });

  // Klik notifikasi listener
  const responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('👆 User klik notifikasi:', data);

    if (data?.travel_document_id) {
      // router.push(`/detail?id=${data.travel_document_id}`);
      console.log('Navigasi ke SJN ID:', data.travel_document_id);
    }
  });

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}