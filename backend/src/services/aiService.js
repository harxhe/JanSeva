const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const transcribe = async (filePath, language) => {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    if (language) {
      formData.append("language", language);
    }

    const response = await axios.post(`${AI_SERVICE_URL}/transcribe`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error) {
    console.error("AI Service Error (Transcribe):", error.message);
    throw error;
  }
};

const classify = async (text) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/classify`, {
      text,
      labels: ["Roads", "Water", "Sanitation", "Electrical", "Drainage", "Other"],
      multi_label: false
    });
    return response.data;
  } catch (error) {
    console.error("AI Service Error (Classify):", error.message);
    throw error;
  }
};

const extract = async (text) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/extract`, {
      text,
      labels: ["Roads", "Water", "Sanitation", "Electrical", "Drainage", "Other"],
    });
    return response.data;
  } catch (error) {
    console.error("AI Service Error (Extract):", error.message);
    throw error;
  }
};

const translate = async (text, targetLanguage = "English") => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/translate`, {
      text,
      target_language: targetLanguage,
    });
    return response.data;
  } catch (error) {
    console.error("AI Service Error (Translate):", error.message);
    throw error;
  }
};

const chat = async (text, history = [], language = "en") => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
      text,
      history,
      language,
    });
    return response.data; // Returns { response: str, audio_base64: str, model_name: str }
  } catch (error) {
    console.error("AI Service Error (Chat):", error.message);
    throw error;
  }
};

module.exports = {
  transcribe,
  classify,
  extract,
  translate,
  chat,
};
