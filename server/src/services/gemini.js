const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const MODEL = 'gemini-2.0-flash';

// El cliente se crea al primer uso: sin GEMINI_API_KEY el resto de la API debe seguir funcionando
let ai = null;
const obtenerCliente = () => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('El servicio de IA no está configurado');
    error.status = 503;
    throw error;
  }
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
};

const generarContenido = async (prompt, opciones = {}) => {
  try {
    const response = await obtenerCliente().models.generateContent({
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

module.exports = { MODEL, generarContenido };
