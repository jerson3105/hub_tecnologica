// Avance de los OKR, con la misma regla que el servidor (services/inicio.js avanceOkr): cada
// actividad cuenta hasta su meta numérica; sin meta, cuenta si está completada.
export const avanceDe = (actividades = []) => {
  if (!actividades.length) return null;
  const suma = actividades.reduce((total, a) => {
    const meta = Number(a.meta_numerica);
    if (!(meta > 0)) return total + (a.estado === 'completado' ? 1 : 0);
    return total + Math.min(Math.max(Number(a.meta_real) || 0, 0) / meta, 1);
  }, 0);
  return Math.round((suma / actividades.length) * 100);
};

export const actividadesDe = (objetivo) => (objetivo.resultadosClave || []).flatMap((rc) => rc.actividades || []);
