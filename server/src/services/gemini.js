const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-2.0-flash';

const generarContenido = async (prompt, opciones = {}) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      ...opciones
    });
    return response.text;
  } catch (error) {
    logger.error('Error al generar contenido con Gemini:', error);
    throw error;
  }
};

module.exports = { ai, MODEL, generarContenido };
