import client from "./client";

/**
 * Fetch all public configurations (logo URL, company name, etc.)
 */
export const fetchPublicSettings = async () => {
  const { data } = await client.get("/public/settings");
  return data;
};

/**
 * Update a setting key-value pair.
 */
export const updateSettingValue = async (key, value) => {
  const { data } = await client.put("/settings", { key, value });
  return data;
};

/**
 * Upload a custom logo file.
 */
export const uploadCustomLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);

  const { data } = await client.post("/settings/upload-logo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
