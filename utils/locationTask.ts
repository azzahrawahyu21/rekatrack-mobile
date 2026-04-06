import { apiFetch } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";

const LOCATION_TASK_NAME = "delivery-tracking-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;

  const { locations } = data as any;
  const location = locations[0];
  if (!location) return;

  const travelDocumentId = await AsyncStorage.getItem("ACTIVE_SJN_ID");
  if (!travelDocumentId) return;

  try {
    await apiFetch("/send-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        travel_document_id: [Number(travelDocumentId)],
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }),
    });
  } catch (e) {
    console.log("Gagal kirim lokasi background");
  }
});

export { LOCATION_TASK_NAME };
