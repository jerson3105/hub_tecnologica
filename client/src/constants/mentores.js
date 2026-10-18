// Catálogos de la red de mentores (antes repetidos en Mentores, MisMentores y MentorMatch).
// En la BD se guardan como texto: no cambiar los valores sin migrar los datos.

// Temas de sesión que puede trabajar (campo `sesiones`)
export const TEMAS_MENTORIA = [
  'Unit Economics', 'Modelos de negocio', 'Growth Marketing', 'Análisis de mercado',
  'Elevator Pitch', 'Innovación social', 'Inteligencia artificial', 'Pricing'
];

// Sectores de startups (campo `startups`)
export const SECTORES_MENTORIA = [
  'Agritech', 'Biotech', 'Civictech', 'Construcción y vivienda', 'E-commerce', 'Edtech',
  'Energía y tecnología limpia', 'Fintech', 'Foodtech', 'Home Services',
  'Industrias culturales y creativas', 'Información y comunicaciones', 'Insuretech',
  'Logística y transporte', 'Manufactura', 'Medios y entretenimiento', 'MineTech', 'ModaTech', 'Otros'
];

export const ODS_MENTORIA = [
  '1. Fin de la pobreza', '2. Hambre Cero', '3. Salud y Bienestar', '4. Educación de calidad',
  '5. Igualdad de género', '6. Agua limpia y saneamiento', '7. Energía asequible y no contaminante',
  '8. Trabajo decente y crecimiento económico', '9. Industria, innovación e infraestructura',
  '10. Reducción de las desigualdades', '11. Ciudades y comunidades sostenibles',
  '12. Producción y consumo responsables', '13. Acción por el clima', '14. Vida submarina',
  '15. Vida de ecosistemas terrestres', '16. Paz, justicia e instituciones sólidas',
  '17. Alianzas para lograr los objetivos'
];

// Preguntas del match con IA
export const AREAS_MATCH = [
  'Tecnología', 'Product Market Fit', 'Comercial / Ventas', 'Finanzas', 'Legal / Tributos',
  'Logística', 'Producto', 'Marketing / Comunicación', 'Comercio Internacional',
  'Liderazgo / Gestión de equipos', 'Innovación / Desarrollo de producto'
];

export const PREFERENCIAS_MATCH = ['En mi sector específico', 'Con visión general de negocios', 'No tengo preferencias'];

// Los catálogos del mentor llegan como arreglo o como texto JSON según el driver
export const listaDe = (valor) => {
  if (Array.isArray(valor)) return valor;
  if (typeof valor === 'string') {
    try {
      const lista = JSON.parse(valor);
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  }
  return [];
};
