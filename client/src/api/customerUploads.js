import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Upload one ID scan (JPG/PNG/WebP/PDF). Field name must be `file`. */
export async function postCustomerIdDocument(customerId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return axios.post(`${baseURL}/customers/${customerId}/id-documents`, fd, {
    headers: { ...authHeader() },
    timeout: 120_000,
  });
}

export async function deleteCustomerIdDocument(customerId, fileId) {
  return axios.delete(`${baseURL}/customers/${customerId}/id-documents/${encodeURIComponent(fileId)}`, {
    headers: { ...authHeader() },
    timeout: 30_000,
  });
}
