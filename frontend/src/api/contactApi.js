import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Submit a contact/lead form to the public API.
 * No authentication required.
 */
export const submitContactForm = async (formData) => {
  const { data } = await axios.post(`${API_URL}/public/contact`, formData);
  return data;
};
