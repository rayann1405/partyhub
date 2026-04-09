import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Inject access token
api.interceptors.request.use((config) => {
  const tokens = localStorage.getItem("tokens");
  if (tokens) {
    const { access } = JSON.parse(tokens);
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const tokens = localStorage.getItem("tokens");
        if (!tokens) throw new Error();
        const { refresh } = JSON.parse(tokens);
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem("tokens", JSON.stringify(data));
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("tokens");
        localStorage.removeItem("user");
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
