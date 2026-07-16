const Setting = require("../models/Setting");
const fs = require("fs");
const path = require("path");

/**
 * GET /api/public/settings
 * Retrieve all public settings. No authentication required.
 */
const getPublicSettings = async (req, res) => {
  try {
    const list = await Setting.find({});
    const settings = {};
    list.forEach((s) => {
      settings[s.key] = s.value;
    });
    // Default fallback values
    if (!settings.companyName) settings.companyName = "Dynamics Square";
    if (!settings.customLogo) settings.customLogo = "";

    res.json(settings);
  } catch (err) {
    console.error("[settings] Get error:", err);
    res.status(500).json({ message: "Failed to retrieve settings" });
  }
};

/**
 * PUT /api/settings
 * Update settings key-value pair. Admin only.
 */
const updateSetting = async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ message: "Setting key is required" });
  }

  try {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value: String(value || "").trim() },
      { new: true, upsert: true }
    );
    res.json({ message: "Setting updated", setting });
  } catch (err) {
    console.error("[settings] Update error:", err);
    res.status(500).json({ message: "Failed to update setting" });
  }
};

/**
 * POST /api/settings/upload-logo
 * Upload custom logo file. Admin only.
 */
const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    // Construct public file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update in database setting key "customLogo"
    await Setting.findOneAndUpdate(
      { key: "customLogo" },
      { value: fileUrl },
      { new: true, upsert: true }
    );

    res.json({
      message: "Logo uploaded successfully",
      url: fileUrl,
    });
  } catch (err) {
    console.error("[settings] Logo upload error:", err);
    res.status(500).json({ message: "Failed to process logo upload" });
  }
};

module.exports = { getPublicSettings, updateSetting, uploadLogo };
