import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, Star, MessageSquare, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { formatFecha } from '../utils/fechas';
import { tipoSesion } from '../constants/sesiones';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { clasesBoton, clasesIconButton } from '../components/ui/estilos';

const SesionNps = () => {
  const { id } = useParams();
  const { data: datos, isLoading: cargando } = useQuery({
    queryKey: ['npsSesion', id],
    queryFn: () => api.get(`/nps/sesion/${id}`).then(r => r.data),
    enabled: !!id
  });

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!datos?.sesion) {
    return (
      <EmptyState
        icono={AlertCircle}
        tono="neutral"
        titulo="Sesión no encontrada"
        accion={<Link to="/sesiones" className={clasesBoton({ variante: 'secondary' })}>Volver a Sesiones</Link>}
      />
    );
  }

  const { sesion, respuestas, promedio, total } = datos;
  const tipo = tipoSesion(sesion.tipo);

  // NPS breakdown
  let promotores = 0, pasivos = 0, detractores = 0;
  respuestas.forEach(r => {
    if (r.puntuacion >= 9) promotores++;
    else if (r.puntuacion >= 7) pasivos++;
    else detractores++;
  });
  const npsScore = total > 0 ? Math.round(((promotores - detractores) / total) * 100) : 0;

  const getColorPuntuacion = (p) => {
    if (p >= 9) return 'text-green-700 bg-green-50 border-green-200';
    if (p >= 7) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getTono = (p) => {
    if (p >= 9) return 'green';
    if (p >= 7) return 'amber';
    return 'red';
  };

  const getLabel = (p) => {
    if (p >= 9) return 'Promotor';
    if (p >= 7) return 'Pasivo';
    return 'Detractor';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Link to="/sesiones" aria-label="Volver a Sesiones" title="Volver a Sesiones" className={clasesIconButton({ tono: 'neutral', className: '-ml-2' })}>
          <ArrowLeft size={24} aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-brand-dark">Evaluaciones NPS</h1>
          <p className="text-gray-500 mt-1">{sesion.titulo} • {sesion.programa?.nombre} • {formatFecha(sesion.fecha)}</p>
        </div>
        <Badge tono={tipo.tono} className="whitespace-nowrap">{tipo.label}</Badge>
      </div>

      {/* Stats cards */}
      {total > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star size={24} className="text-amber-400" fill="currentColor" aria-hidden="true" />
                <span className="text-3xl font-bold text-brand-dark">{promedio}</span>
              </div>
              <p className="text-xs text-gray-500">Promedio / 10</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={24} className={npsScore >= 0 ? 'text-green-600' : 'text-red-600'} aria-hidden="true" />
                <span className="text-3xl font-bold text-brand-dark">{npsScore}</span>
              </div>
              <p className="text-xs text-gray-500">NPS Score</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Users size={24} className="mx-auto text-brand-cyan-ink mb-1" aria-hidden="true" />
              <span className="text-3xl font-bold text-brand-dark">{total}</span>
              <p className="text-xs text-gray-500">Respuestas</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-700">Promotores (9-10)</span>
                  <span className="text-xs font-bold text-green-700">{promotores}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5" aria-hidden="true">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (promotores / total) * 100 : 0}%` }}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700">Pasivos (7-8)</span>
                  <span className="text-xs font-bold text-amber-700">{pasivos}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5" aria-hidden="true">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (pasivos / total) * 100 : 0}%` }}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-red-700">Detractores (0-6)</span>
                  <span className="text-xs font-bold text-red-700">{detractores}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5" aria-hidden="true">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (detractores / total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual responses */}
          <section aria-labelledby="titulo-respuestas" className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 id="titulo-respuestas" className="text-lg font-semibold text-brand-dark mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-brand-cyan-ink" aria-hidden="true" /> Respuestas Individuales ({total})
            </h2>
            <ul className="space-y-4">
              {respuestas.map((nps) => (
                <li key={nps.id} className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-brand-cyan/15 rounded-full flex items-center justify-center text-brand-cyan-ink font-semibold text-sm shrink-0" aria-hidden="true">
                        {nps.usuario?.nombre?.[0]}{nps.usuario?.apellido?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark text-sm">{nps.usuario?.nombre} {nps.usuario?.apellido}</p>
                        <p className="text-xs text-gray-500">{formatFecha(nps.created_at || nps.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold ${getColorPuntuacion(nps.puntuacion)}`}>
                        {nps.puntuacion}/10
                      </div>
                      <Badge tono={getTono(nps.puntuacion)}>{getLabel(nps.puntuacion)}</Badge>
                    </div>
                  </div>
                  {/* Representación visual de la puntuación (ya se lee como "n/10") */}
                  <div className="flex gap-1 mb-3" aria-hidden="true">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <Star key={n} size={14} className={n <= nps.puntuacion ? 'text-amber-400' : 'text-gray-200'} fill={n <= nps.puntuacion ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  {nps.comentario && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Comentario</p>
                      <p className="text-sm text-gray-700">{nps.comentario}</p>
                    </div>
                  )}
                  {nps.areas_mejora && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Áreas de Mejora</p>
                      <p className="text-sm text-gray-700">{nps.areas_mejora}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <EmptyState
          icono={AlertCircle}
          tono="neutral"
          titulo="Aún no hay evaluaciones para esta sesión"
        />
      )}
    </div>
  );
};

export default SesionNps;
