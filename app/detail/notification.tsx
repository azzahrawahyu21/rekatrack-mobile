import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, router } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { apiFetch } from "@/utils/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  travelDocument?: {
    id: number;
    no_travel_document: string;
    project: string;
  };
};

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // const fetchNotifications = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await apiFetch("/notifications");
  //     if (response?.success) {
  //       setNotifications(response.data.data || []);
  //     }
  //   } catch (error) {
  //     console.error("Gagal mengambil notifikasi:", error);
  //     Alert.alert("Error", "Gagal memuat notifikasi");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchNotifications = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true); // ✅ hanya tampil loader saat pertama
      const response = await apiFetch("/notifications");
      if (response?.success) {
        setNotifications(response.data.data || []);
        // ✅ Update unread count dari response sekaligus (hemat 1 request)
        if (response.unread_count !== undefined) {
          setUnreadCount(response.unread_count);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
      Alert.alert("Error", "Gagal memuat notifikasi");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiFetch("/notifications/unread-count");
      if (response?.success) {
        setUnreadCount(response.count || 0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // await apiFetch("/notifications/mark-all-read", { method: "POST" });
      await apiFetch("/notifications/read-all", {
        method: "POST",
      });
      setUnreadCount(0);
      await fetchNotifications(false); // Refresh data tanpa tampil loader
    } catch (error) {
      Alert.alert("Error", "Gagal menandai semua sebagai dibaca");
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  // const onRefresh = async () => {
  //   setRefreshing(true);
  //   await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  //   setRefreshing(false);
  // };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(false); // ✅ pakai refreshControl, bukan loader
    await fetchUnreadCount();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, [])
  );

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        item.is_read ? styles.readNotification : styles.unreadNotification,
      ]}
      onPress={() => {
        markAsRead(item.id);
        if (item.travelDocument?.id) {
          router.push({
            pathname: "/detail",
            params: { id: item.travelDocument.id.toString() },
          });
        }
      }}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="notifications"
          size={26}
          color={item.is_read ? "#94A3B8" : "#f59e0b"}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.notifTitle, !item.is_read && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{item.created_at}</Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />

      <ThemedView style={styles.container}>
        {/* Header Custom */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifikasi</Text>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Tandai semua dibaca</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNotification}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E3A8A"]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={70} color="#CBD5E1" />
                <Text style={styles.emptyText}>Belum ada notifikasi</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </ThemedView>
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
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  markAllButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  markAllText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: { padding: 12 },

  notificationCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: "#FEFCE8",
  },
  readNotification: {},
  iconContainer: {
    marginRight: 14,
    paddingTop: 4,
  },
  content: { flex: 1 },
  unreadTitle: {
    color: "#1E40AF",
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
  },
});