import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, Star, MessageSquare, TrendingUp, Users, AlertCircle } from 'lucide-react';

const SesionNps = () => {
  const { id } = useParams();
  const { data: datos, isLoading: cargando } = useQuery({
    queryKey: ['npsSesion', id],
    queryFn: () => api.get(`/nps/sesion/${id}`).then(r => r.data),
    enabled: !!id
  });

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!datos?.sesion) {
    return <div className="text-center py-12 text-gray-500">Sesión no encontrada</div>;
  }

  const { sesion, respuestas, promedio, total } = datos;

  // NPS breakdown
  let promotores = 0, pasivos = 0, detractores = 0;
  respuestas.forEach(r => {
    if (r.puntuacion >= 9) promotores++;
    else if (r.puntuacion >= 7) pasivos++;
    else detractores++;
  });
  const npsScore = total > 0 ? Math.round(((promotores - detractores) / total) * 100) : 0;

  const getColorPuntuacion = (p) => {
    if (p >= 9) return 'text-green-600 bg-green-50 border-green-200';
    if (p >= 7) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getLabel = (p) => {
    if (p >= 9) return 'Promotor';
    if (p >= 7) return 'Pasivo';
    return 'Detractor';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/sesiones" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Evaluaciones NPS</h1>
          <p className="text-gray-500 mt-1">{sesion.titulo} • {sesion.programa?.nombre} • {new Date(sesion.fecha).toLocaleDateString('es-ES')}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          sesion.tipo === 'taller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>{sesion.tipo === 'taller' ? 'Taller' : 'Seguimiento'}</span>
      </div>

      {/* Stats cards */}
      {total > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star size={24} className="text-amber-400" fill="currentColor" />
                <span className="text-3xl font-bold text-gray-900">{promedio}</span>
              </div>
              <p className="text-xs text-gray-500">Promedio / 10</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp size={24} className={npsScore >= 0 ? 'text-green-500' : 'text-red-500'} />
                <span className="text-3xl font-bold text-gray-900">{npsScore}</span>
              </div>
              <p className="text-xs text-gray-500">NPS Score</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Users size={24} className="mx-auto text-indigo-500 mb-1" />
              <span className="text-3xl font-bold text-gray-900">{total}</span>
              <p className="text-xs text-gray-500">Respuestas</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-600">Promotores (9-10)</span>
                  <span className="text-xs font-bold text-green-600">{promotores}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (promotores / total) * 100 : 0}%` }}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-600">Pasivos (7-8)</span>
                  <span className="text-xs font-bold text-amber-600">{pasivos}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (pasivos / total) * 100 : 0}%` }}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-red-600">Detractores (0-6)</span>
                  <span className="text-xs font-bold text-red-600">{detractores}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (detractores / total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual responses */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-600" /> Respuestas Individuales ({total})
            </h2>
            <div className="space-y-4">
              {respuestas.map((nps) => (
                <div key={nps.id} className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {nps.usuario?.nombre?.[0]}{nps.usuario?.apellido?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{nps.usuario?.nombre} {nps.usuario?.apellido}</p>
                        <p className="text-xs text-gray-400">{new Date(nps.created_at || nps.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold ${getColorPuntuacion(nps.puntuacion)}`}>
                        {nps.puntuacion}/10
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getColorPuntuacion(nps.puntuacion)}`}>
                        {getLabel(nps.puntuacion)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <Star key={n} size={14} className={n <= nps.puntuacion ? 'text-amber-400' : 'text-gray-200'} fill={n <= nps.puntuacion ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  {nps.comentario && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Comentario</p>
                      <p className="text-sm text-gray-700">{nps.comentario}</p>
                    </div>
                  )}
                  {nps.areas_mejora && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Áreas de Mejora</p>
                      <p className="text-sm text-gray-700">{nps.areas_mejora}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aún no hay evaluaciones para esta sesión</p>
        </div>
      )}
    </div>
  );
};

export default SesionNps;
