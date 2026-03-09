import axios from "axios";
import Cookies from "js-cookie";

var BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://15.207.144.166";

var api = axios.create({
  baseURL: BASE_URL + "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true
});

api.interceptors.request.use(function(config) {
  var token = Cookies.get("cc_access");
  if (token && config.headers) {
    config.headers["Authorization"] = "Bearer " + token;
  }
  return config;
});

var isRefreshing = false;
var pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function drainQueue(err: unknown, token: string | null) {
  pendingQueue.forEach(function(item) {
    if (err) { item.reject(err); }
    else if (token) { item.resolve(token); }
  });
  pendingQueue = [];
}

function clearTokens() {
  Cookies.remove("cc_access");
  Cookies.remove("cc_refresh");
}

function goToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

api.interceptors.response.use(
  function(response) { return response; },
  async function(error) {
    var status = error && error.response && error.response.status;
    var config = error && error.config;

    if (status !== 401 || !config || config._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        pendingQueue.push({ resolve: resolve, reject: reject });
      }).then(function(newToken) {
        config.headers["Authorization"] = "Bearer " + newToken;
        return api(config);
      });
    }

    config._retry = true;
    isRefreshing = true;

    var refreshToken = Cookies.get("cc_refresh");

    if (!refreshToken) {
      clearTokens();
      goToLogin();
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      var res = await axios.post(BASE_URL + "/api/auth/refresh", { refreshToken: refreshToken });
      var newToken: string = res.data && res.data.data && res.data.data.accessToken;
      Cookies.set("cc_access", newToken, {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
      });
      drainQueue(null, newToken);
      config.headers["Authorization"] = "Bearer " + newToken;
      return api(config);
    } catch(refreshError) {
      drainQueue(refreshError, null);
      clearTokens();
      goToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    var data = error.response && error.response.data;
    if (data && typeof data.message === "string") { return data.message; }
    if (data && typeof data.error === "string") { return data.error; }
    if (data && Array.isArray(data.message)) { return String(data.message[0]); }
    if (error.message) { return error.message; }
    return "Something went wrong";
  }
  if (error instanceof Error) { return error.message; }
  return "An unexpected error occurred";
}

export default api;
