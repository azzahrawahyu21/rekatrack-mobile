import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL =
  process.env.REKATRACK_API ?? "https://rekatrack.ptrekaindo.co.id/api";

const DEFAULT_TIMEOUT_MS = 15000;

type ApiHeaders = Record<string, string>;

type RequestBody = RequestInit["body"];

export class ApiError extends Error {
  status: number;
  data?: unknown;
  raw?: unknown;

  constructor(message: string, status = 0, data?: unknown, raw?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.raw = raw;
  }
}

const isReactNativeFormData = (body: RequestBody): body is FormData => {
  if (!body || typeof body !== "object") return false;
  return typeof (body as FormData).append === "function";
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildHeaders = (token: string | null, options: RequestInit): ApiHeaders => {
  const isFormData = isReactNativeFormData(options.body);

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as ApiHeaders),
  };
};

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> => {
  const token = await AsyncStorage.getItem("token");
  const headers = buildHeaders(token, options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await parseResponseBody(response);

    if (response.status === 401) {
      await AsyncStorage.removeItem("token");
      throw new ApiError("Session expired. Please login again.", 401, data);
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data && "message" in data
          ? String((data as { message?: string }).message ?? "Request failed")
          : "Request failed";

      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timeout", 408, null, error);
    }

    if (error instanceof Error) {
      throw new ApiError(error.message || "Network error", 0, null, error);
    }

    throw new ApiError("Network error", 0, null, error);
  } finally {
    clearTimeout(timeoutId);
  }
};
