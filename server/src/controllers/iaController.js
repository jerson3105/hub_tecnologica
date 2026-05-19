const { Mentor, OnePager, Integrante, Emprendimiento } = require('../models');
const { generarContenido } = require('../services/gemini');
const logger = require('../utils/logger');

const CAMPOS_REQUERIDOS_OP = ['estado_proyecto', 'descripcion', 'problematica', 'solucion', 'modelo_negocio'];

function onePagerCompleto(op) {
  if (!op) return false;
  return CAMPOS_REQUERIDOS_OP.every(c => op[c] && op[c].toString().trim().length > 0);
}

const matchMentor = async (req, res) => {
  try {
    const { areas, apoyo_esperado, reto_principal, resultados_esperados, preferencia_sector, comentarios } = req.body;

    if (!areas || areas.length === 0 || !reto_principal) {
      return res.status(400).json({ mensaje: 'Las áreas de mentoría y el reto principal son requeridos' });
    }

    // Obtener emprendimiento(s) del usuario y su OnePager
    const integrantes = await Integrante.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['emprendimiento_id']
    });

    if (integrantes.length === 0) {
      return res.status(400).json({ mensaje: 'No perteneces a ningún emprendimiento' });
    }

    const empId = integrantes[0].emprendimiento_id;
    const emprendimiento = await Emprendimiento.findByPk(empId);
    const onePager = await OnePager.findOne({ where: { emprendimiento_id: empId } });

    if (!onePagerCompleto(onePager)) {
      return res.status(400).json({
        mensaje: 'Debes completar tu One Pager antes de usar el match con IA',
        onePagerIncompleto: true
      });
    }

    // Obtener mentores activos
    const mentores = await Mentor.findAll({ where: { activo: true } });

    if (mentores.length === 0) {
      return res.status(404).json({ mensaje: 'No hay mentores disponibles actualmente' });
    }

    // Construir perfil de mentores para el prompt
    const perfilesMentores = mentores.map(m => ({
      id: m.id,
      nombre: `${m.nombre} ${m.apellido}`,
      biografia: m.biografia || 'Sin biografía',
      sesiones: m.sesiones || [],
      startups: m.startups || [],
      ods: m.ods || []
    }));

    const prompt = `Eres un asistente experto en matching de mentores para emprendedores en una incubadora de startups.

PERFIL DEL EMPRENDIMIENTO (One Pager):
- Nombre del proyecto: ${emprendimiento?.nombre || 'No especificado'}
- Estado del proyecto: ${onePager.estado_proyecto}
- Descripción: ${onePager.descripcion}
- Problemática / Oportunidad: ${onePager.problematica}
- Solución / Propuesta de Valor: ${onePager.solucion}
- Modelo de Negocio: ${onePager.modelo_negocio}

NECESIDADES DEL EMPRENDEDOR:
- Áreas donde necesita mentoría: ${areas.join(', ')}
- Tipo de apoyo que espera: ${apoyo_esperado || 'No especificado'}
- Principal reto o desafío actual: ${reto_principal}
- Resultados que espera lograr: ${resultados_esperados || 'No especificado'}
- Preferencia de mentor: ${preferencia_sector || 'No tiene preferencias'}
- Comentarios adicionales: ${comentarios || 'Ninguno'}

LISTA DE MENTORES DISPONIBLES:
${JSON.stringify(perfilesMentores, null, 2)}

INSTRUCCIONES:
1. Analiza el perfil del emprendimiento y compáralo con cada mentor disponible.
2. Selecciona el TOP 3 de mentores que mejor se ajustan a las necesidades del emprendimiento.
3. Para cada mentor seleccionado, explica brevemente por qué es un buen match.

RESPONDE ESTRICTAMENTE en el siguiente formato JSON (sin markdown, sin backticks, solo JSON puro):
{
  "matches": [
    {
      "mentor_id": <number>,
      "compatibilidad": <number entre 1 y 100>,
      "razon": "<explicación breve y clara en español de por qué este mentor es ideal para el emprendimiento>"
    }
  ]
}

Si ningún mentor es claramente compatible, igualmente devuelve los 3 mejores con su nivel de compatibilidad real.`;

    const respuestaTexto = await generarContenido(prompt);

    // Parsear la respuesta JSON de Gemini
    let resultado;
    try {
      // Limpiar posibles backticks o markdown
      const textoLimpio = respuestaTexto.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      resultado = JSON.parse(textoLimpio);
    } catch (parseError) {
      logger.error('Error al parsear respuesta de Gemini:', { respuesta: respuestaTexto, error: parseError.message });
      return res.status(500).json({ mensaje: 'Error al procesar la respuesta de la IA' });
    }

    // Enriquecer con datos completos del mentor
    const matchesEnriquecidos = resultado.matches.map(match => {
      const mentor = mentores.find(m => m.id === match.mentor_id);
      return {
        ...match,
        mentor: mentor ? {
          id: mentor.id,
          nombre: mentor.nombre,
          apellido: mentor.apellido,
          biografia: mentor.biografia,
          foto: mentor.foto,
          linkedin: mentor.linkedin,
          calendly: mentor.calendly,
          sesiones: mentor.sesiones,
          startups: mentor.startups,
          ods: mentor.ods
        } : null
      };
    }).filter(m => m.mentor !== null);

    res.json({ matches: matchesEnriquecidos });
  } catch (error) {
    logger.error('Error en match de mentor con IA:', error);
    res.status(500).json({ mensaje: 'Error al procesar el match con IA' });
  }
};

module.exports = { matchMentor };
