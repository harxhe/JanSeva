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
    });
    return response.data;
  } catch (error) {
    console.error("AI Service Error (Classify):", error.message);
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
  chat,
};
