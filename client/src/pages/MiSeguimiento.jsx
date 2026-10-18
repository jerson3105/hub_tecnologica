import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatFecha } from '../utils/fechas';
import { tipoSesion } from '../constants/sesiones';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import {
  ClipboardList, Calendar, FolderKanban, Rocket, AlertCircle, Video,
  FileSearch, BookOpen, Presentation, UserCheck
} from 'lucide-react';

const TAB_CLS = (active) => `px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${active ? 'bg-brand-dark text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`;

// `tono` es el de Badge; `dot` el del punto que acompaña a cada compromiso
const ESTADO_ACT = {
  planeado: { label: 'Planeado', tono: 'neutral', dot: 'bg-gray-400' },
  en_progreso: { label: 'En progreso', tono: 'amber', dot: 'bg-amber-500' },
  completado: { label: 'Completado', tono: 'green', dot: 'bg-green-500' },
  no_logrado: { label: 'No logrado', tono: 'red', dot: 'bg-red-500' }
};

// Icono de cada tipo de sesión (la etiqueta y los colores vienen de constants/sesiones)
const SIN_DATOS = [];

// Punto de color + descripción + estado de un compromiso
const ContenidoCompromiso = ({ compromiso }) => {
  const est = ESTADO_ACT[compromiso.estado];
  return (
    <>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${est?.dot || ''}`} aria-hidden="true"></span>
      <span className="text-sm text-gray-700 flex-1 min-w-0 break-words">{compromiso.descripcion}</span>
      {est && <Badge tono={est.tono} forma="tag" className="shrink-0">{est.label}</Badge>}
    </>
  );
};

const MiSeguimiento = () => {
  const [tab, setTab] = useState('timeline');

  // Obtener emprendimiento del usuario
  const { data: miEmpData, isLoading: loadingEmp } = useQuery({
    queryKey: ['mi-emprendimiento'],
    queryFn: () => api.get('/emprendimientos/mi-emprendimiento').then(r => r.data)
  });

  // Derivado de la consulta (antes se copiaba a estado con un efecto)
  const empData = miEmpData?.emprendimientos?.[0] || null;
  const empId = empData?.id ?? null;

  // Timeline data
  const { data: timelineData, isLoading: loadingTimeline } = useQuery({
    queryKey: ['timeline', empId],
    queryFn: () => api.get(`/compromisos/timeline/${empId}`).then(r => r.data.seguimientos),
    enabled: !!empId
  });

  // Compromisos pendientes
  const { data: pendientesData } = useQuery({
    queryKey: ['compromisos-pendientes', empId],
    queryFn: () => api.get(`/compromisos/pendientes/${empId}`).then(r => r.data.compromisos),
    enabled: !!empId
  });

  const timeline = timelineData || SIN_DATOS;
  const pendientes = pendientesData || SIN_DATOS;

  // Filter sessions by type (reverse to show newest first)
  const diagnosticas = useMemo(() => timeline.filter(s => ['diagnostica_1', 'diagnostica_2', 'diagnostica_final'].includes(s.sesion?.tipo)).reverse(), [timeline]);
  const talleres = useMemo(() => timeline.filter(s => s.sesion?.tipo === 'taller').reverse(), [timeline]);
  const unoAUnoPrograma = useMemo(() => timeline.filter(s => ['uno_a_uno_programa', 'seguimiento'].includes(s.sesion?.tipo)).reverse(), [timeline]);
  const unoAUnoTaller = useMemo(() => timeline.filter(s => s.sesion?.tipo === 'uno_a_uno_taller').reverse(), [timeline]);

  const counts = useMemo(() => ({
    diagnosticas: diagnosticas.length,
    talleres: talleres.length,
    programa: unoAUnoPrograma.length,
    taller11: unoAUnoTaller.length
  }), [diagnosticas, talleres, unoAUnoPrograma, unoAUnoTaller]);

  if (loadingEmp || (empId && loadingTimeline)) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!empId) {
    return <EmptyState icono={Rocket} tono="neutral" titulo="No se encontró tu emprendimiento" />;
  }

  const pestanias = [
    { key: 'timeline', label: 'Timeline' },
    { key: 'diagnosticos', label: 'Diagnósticos', count: counts.diagnosticas },
    { key: 'talleres', label: 'Talleres', count: counts.talleres },
    { key: '1a1_programa', label: '1 a 1 Programa', count: counts.programa },
    { key: '1a1_taller', label: '1 a 1 Taller', count: counts.taller11 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-cyan/10 rounded-xl"><ClipboardList size={22} className="text-brand-cyan-ink" aria-hidden="true" /></div>
          Mi Seguimiento
        </h1>
        <p className="text-gray-500 mt-1 sm:ml-12">Seguimiento de tu emprendimiento en el programa</p>
      </div>

      {/* Info del emprendimiento */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green-ink font-bold text-xl shrink-0" aria-hidden="true">
            {empData?.nombre?.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-brand-dark text-lg">{empData?.nombre}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FolderKanban size={14} className="text-brand-purple" aria-hidden="true" />
              <span>{empData?.programa?.nombre}</span>
            </div>
          </div>
          {pendientes.length > 0 && (
            <Badge tono="amber" icono={AlertCircle} className="sm:ml-auto">
              {pendientes.length} compromiso(s) pendiente(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Secciones del seguimiento">
        {pestanias.map(t => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            aria-controls="mi-seguimiento-panel"
            onClick={() => setTab(t.key)}
            className={TAB_CLS(tab === t.key)}
          >
            {t.label} {t.count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${tab === t.key ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div id="mi-seguimiento-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'timeline' && <TimelineTab timeline={timeline} pendientes={pendientes} />}
        {tab === 'diagnosticos' && <SesionesReadOnlyTab sesiones={diagnosticas} tipo="diagnostico" />}
        {tab === 'talleres' && <SesionesReadOnlyTab sesiones={talleres} tipo="taller" />}
        {tab === '1a1_programa' && <SesionesReadOnlyTab sesiones={unoAUnoPrograma} tipo="programa" />}
        {tab === '1a1_taller' && <SesionesReadOnlyTab sesiones={unoAUnoTaller} tipo="taller11" />}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: TIMELINE (read-only for emprendedor)
// ═══════════════════════════════════════════════════════════
const TimelineTab = ({ timeline, pendientes }) => {
  if (timeline.length === 0) {
    return (
      <EmptyState
        icono={Calendar}
        titulo="No hay sesiones registradas"
        descripcion="Las sesiones del programa aparecerán aquí"
      />
    );
  }

  return (
    <div className="space-y-1">
      {/* Compromisos pendientes */}
      {pendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-3">
            <AlertCircle size={16} aria-hidden="true" /> Compromisos pendientes
          </h3>
          <ul className="space-y-2">
            {pendientes.map(c => (
              <li key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <ContenidoCompromiso compromiso={c} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true"></div>
        <ol className="space-y-6">
          {[...timeline].reverse().map((seg) => {
            const tipo = tipoSesion(seg.sesion?.tipo);
            return (
              <li key={seg.id} className="relative pl-14">
                <div className="absolute left-4 top-5 w-5 h-5 rounded-full bg-white border-2 border-brand-cyan flex items-center justify-center z-10" aria-hidden="true">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge tono={tipo.tono} forma="tag" icono={tipo.icono}>{tipo.label}</Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={10} aria-hidden="true" /> {formatFecha(seg.sesion?.fecha)}
                      </span>
                    </div>
                    <h4 className="font-bold text-brand-dark">{seg.sesion?.titulo}</h4>
                    {seg.realizado && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="eyebrow mb-1">Lo trabajado</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                      </div>
                    )}
                    {seg.observaciones && (
                      <div className="mt-2">
                        <p className="eyebrow mb-1">Observaciones</p>
                        <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                      </div>
                    )}
                    {seg.enlace_grabacion && (
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-cyan-ink hover:underline">
                        <Video size={14} aria-hidden="true" /> Ver grabación
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SESIONES READ-ONLY (for emprendedor)
// ═══════════════════════════════════════════════════════════
const SesionesReadOnlyTab = ({ sesiones, tipo }) => {
  // `tono` es el de EmptyState (no tiene azul: los talleres usan cian)
  const configs = {
    diagnostico: { icon: FileSearch, tono: 'purple', color: 'bg-purple-50 border-purple-100', iconColor: 'text-purple-600', emptyLabel: 'sesiones diagnósticas' },
    taller: { icon: Presentation, tono: 'cyan', color: 'bg-blue-50 border-blue-100', iconColor: 'text-blue-600', emptyLabel: 'talleres' },
    programa: { icon: UserCheck, tono: 'cyan', color: 'bg-cyan-50 border-cyan-100', iconColor: 'text-cyan-600', emptyLabel: 'sesiones 1 a 1 de programa' },
    taller11: { icon: BookOpen, tono: 'green', color: 'bg-green-50 border-green-100', iconColor: 'text-green-600', emptyLabel: 'sesiones 1 a 1 de taller' }
  };
  const cfg = configs[tipo] || configs.programa;
  const Icon = cfg.icon;

  if (sesiones.length === 0) {
    return (
      <EmptyState
        icono={Icon}
        tono={cfg.tono}
        titulo={`No hay ${cfg.emptyLabel}`}
        descripcion="Aparecerán aquí cuando se programen"
      />
    );
  }

  return (
    <ul className="space-y-4">
      {sesiones.map((seg) => (
        <li key={seg.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className={`px-5 py-3 border-b flex items-center gap-3 ${cfg.color}`}>
            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
              <Icon size={16} className={cfg.iconColor} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Calendar size={10} aria-hidden="true" /> {formatFecha(seg.sesion?.fecha)}
              </p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {seg.realizado ? (
              <div>
                <p className="eyebrow mb-1">Lo trabajado</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin información registrada aún</p>
            )}
            {seg.observaciones && (
              <div>
                <p className="eyebrow mb-1">Observaciones</p>
                <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
              </div>
            )}
            {seg.enlace_grabacion && (
              <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-cyan-ink hover:underline">
                <Video size={14} aria-hidden="true" /> Ver grabación
              </a>
            )}
            {/* Compromisos */}
            {seg.compromisoItems?.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="eyebrow mb-2">Compromisos</p>
                <ul className="space-y-1.5">
                  {seg.compromisoItems.map(c => (
                    <li key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <ContenidoCompromiso compromiso={c} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MiSeguimiento;
