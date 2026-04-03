import Constants from "expo-constants";

const fallbackUrl = "http://localhost:5000";

const resolveHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    "";

  if (!hostUri) {
    return fallbackUrl;
  }

  const host = hostUri.split(":")[0];
  return host ? `http://${host}:5000` : fallbackUrl;
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || resolveHostFromExpo();

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
