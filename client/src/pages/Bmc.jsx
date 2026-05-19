import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LayoutGrid, Plus, Save, Clock, MessageSquare,
  Trash2, Copy, Edit3, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';

const BLOQUES = [
  { key: 'socios_clave', label: 'Socios Clave', desc: '¿Quiénes son tus socios y proveedores clave?', color: 'border-brand-purple/30 bg-brand-purple/5', accent: 'text-brand-purple' },
  { key: 'actividades_clave', label: 'Actividades Clave', desc: '¿Qué actividades clave requiere tu propuesta de valor?', color: 'border-brand-cyan/30 bg-brand-cyan/5', accent: 'text-brand-cyan' },
  { key: 'recursos_clave', label: 'Recursos Clave', desc: '¿Qué recursos clave requiere tu propuesta de valor?', color: 'border-brand-cyan/30 bg-brand-cyan/5', accent: 'text-brand-cyan' },
  { key: 'propuesta_valor', label: 'Propuesta de Valor', desc: '¿Qué valor entregas al cliente? ¿Qué problema resuelves?', color: 'border-amber-300/50 bg-amber-50/50', accent: 'text-amber-600' },
  { key: 'relacion_clientes', label: 'Relación con Clientes', desc: '¿Qué tipo de relación espera cada segmento?', color: 'border-brand-green/30 bg-brand-green/5', accent: 'text-brand-green' },
  { key: 'canales', label: 'Canales', desc: '¿A través de qué canales llegas a tus clientes?', color: 'border-brand-green/30 bg-brand-green/5', accent: 'text-brand-green' },
  { key: 'segmento_clientes', label: 'Segmento de Clientes', desc: '¿Para quién estás creando valor?', color: 'border-brand-dark/20 bg-brand-dark/5', accent: 'text-brand-dark' },
  { key: 'estructura_costos', label: 'Estructura de Costos', desc: '¿Cuáles son los costos más importantes de tu modelo?', color: 'border-orange-300/50 bg-orange-50/50', accent: 'text-orange-600' },
  { key: 'fuentes_ingresos', label: 'Fuentes de Ingresos', desc: '¿Por qué valor están dispuestos a pagar tus clientes?', color: 'border-brand-green/30 bg-brand-green/5', accent: 'text-brand-green' },
];

const Bmc = () => {
  const { data: emprendimientos = [], isLoading: cargando } = useEmprendimientos();
  const invalidate = useInvalidate();
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [versionActual, setVersionActual] = useState(null);
  const [datos, setDatos] = useState({});
  const [nombreVersion, setNombreVersion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [hayCambios, setHayCambios] = useState(false);

  // Auto-select first emprendimiento
  useEffect(() => {
    if (emprendimientos.length > 0 && !empSeleccionado) {
      setEmpSeleccionado(emprendimientos[0]);
    }
  }, [emprendimientos]);

  // Cargar versiones cuando cambia el emprendimiento
  useEffect(() => {
    if (!empSeleccionado) return;
    cargarVersiones(empSeleccionado.id);
  }, [empSeleccionado]);

  const cargarVersiones = async (empId) => {
    try {
      const res = await api.get(`/bmc/emprendimiento/${empId}`);
      setVersiones(res.data.versiones || []);
      if (res.data.versiones?.length > 0) {
        seleccionarVersion(res.data.versiones[0].id);
      } else {
        setVersionActual(null);
        setDatos({});
        setNombreVersion('');
      }
    } catch {
      toast.error('Error al cargar versiones');
    }
  };

  const seleccionarVersion = async (id) => {
    try {
      const res = await api.get(`/bmc/${id}`);
      const bmc = res.data.bmc;
      setVersionActual(bmc);
      setNombreVersion(bmc.nombre || '');
      const d = {};
      BLOQUES.forEach(b => { d[b.key] = bmc[b.key] || ''; });
      setDatos(d);
      setHayCambios(false);
    } catch {
      toast.error('Error al cargar versión');
    }
  };

  const handleCampo = (key, value) => {
    setDatos(prev => ({ ...prev, [key]: value }));
    setHayCambios(true);
  };

  const guardar = async () => {
    if (!versionActual) return;
    setGuardando(true);
    try {
      await api.put(`/bmc/${versionActual.id}`, { ...datos, nombre: nombreVersion });
      toast.success('BMC guardado');
      setHayCambios(false);
      // Refrescar lista de versiones
      cargarVersiones(empSeleccionado.id);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const nuevaVersion = async () => {
    if (!empSeleccionado) return;
    try {
      const res = await api.post('/bmc', {
        emprendimiento_id: empSeleccionado.id
      });
      toast.success('Nueva versión creada');
      await cargarVersiones(empSeleccionado.id);
      // Seleccionar la nueva versión (será la primera por orden DESC)
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear versión');
    }
  };

  const duplicarVersion = async () => {
    if (!empSeleccionado || !versionActual) return;
    try {
      const res = await api.post('/bmc', {
        emprendimiento_id: empSeleccionado.id,
        nombre: `${nombreVersion} (copia)`,
        ...datos
      });
      toast.success('Versión duplicada');
      await cargarVersiones(empSeleccionado.id);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al duplicar');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (emprendimientos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LayoutGrid size={32} className="text-brand-purple" />
        </div>
        <p className="text-gray-400 font-medium">No tienes emprendimientos asignados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-dark/10 rounded-xl"><LayoutGrid className="text-brand-dark" size={22} /></div>
            Business Model Canvas
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Diseña y versiona tu modelo de negocio</p>
        </div>
        {emprendimientos.length > 1 && (
          <select
            value={empSeleccionado?.id || ''}
            onChange={(e) => {
              const emp = emprendimientos.find(em => em.id === parseInt(e.target.value));
              setEmpSeleccionado(emp);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all"
          >
            {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        )}
      </div>

      {/* Version bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-300" />
              <select
                value={versionActual?.id || ''}
                onChange={(e) => seleccionarVersion(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all"
              >
                {versiones.length === 0 && <option value="">Sin versiones</option>}
                {versiones.map(v => (
                  <option key={v.id} value={v.id}>
                    v{v.version} — {v.nombre || `Versión ${v.version}`}
                  </option>
                ))}
              </select>
            </div>
            {versionActual && (
              <div className="flex items-center gap-1">
                {editandoNombre ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={nombreVersion}
                      onChange={(e) => setNombreVersion(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm w-48 focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all"
                      autoFocus
                    />
                    <button onClick={() => { setEditandoNombre(false); setHayCambios(true); }} className="p-1.5 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"><Check size={14} /></button>
                    <button onClick={() => { setEditandoNombre(false); setNombreVersion(versionActual.nombre || ''); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setEditandoNombre(true)} className="text-xs text-gray-400 hover:text-brand-cyan flex items-center gap-1 transition-colors">
                    <Edit3 size={12} /> Renombrar
                  </button>
                )}
              </div>
            )}
            {versionActual?.feedback && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-600">
                <MessageSquare size={10} /> Con feedback
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {versionActual && (
              <>
                <button onClick={duplicarVersion} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl flex items-center gap-1 transition-colors" title="Duplicar versión">
                  <Copy size={14} /> Duplicar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando || !hayCambios}
                  className="px-4 py-1.5 text-sm bg-brand-cyan text-white rounded-xl hover:bg-brand-cyan/90 disabled:opacity-40 flex items-center gap-1 font-medium shadow-sm transition-all hover:shadow-md"
                >
                  <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            )}
            <button onClick={nuevaVersion} className="px-3 py-1.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-1 font-medium shadow-sm transition-all hover:shadow-md">
              <Plus size={14} /> Nueva versión
            </button>
          </div>
        </div>
      </div>

      {/* Feedback del admin */}
      {versionActual?.feedback && (
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-lg shrink-0 mt-0.5"><MessageSquare size={14} className="text-amber-600" /></div>
            <div>
              <p className="text-sm font-semibold text-brand-dark">
                Feedback del equipo técnico
                {versionActual.feedbackUsuario && (
                  <span className="font-normal text-gray-400"> — {versionActual.feedbackUsuario.nombre} {versionActual.feedbackUsuario.apellido}</span>
                )}
                {versionActual.feedback_fecha && (
                  <span className="font-normal text-gray-300 text-xs ml-2">
                    {new Date(versionActual.feedback_fecha).toLocaleDateString('es-ES')}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{versionActual.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Canvas BMC */}
      {versionActual ? (
        <div className="grid grid-cols-10 gap-2.5 auto-rows-auto">
          {/* Fila 1: Socios | Actividades + Recursos | Propuesta | Relación + Canales | Segmento */}
          {/* Socios Clave */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 row-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[0].color}`}>
            <BloqueCanvas bloque={BLOQUES[0]} value={datos[BLOQUES[0].key] || ''} onChange={handleCampo} />
          </div>

          {/* Actividades Clave */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[1].color}`}>
            <BloqueCanvas bloque={BLOQUES[1]} value={datos[BLOQUES[1].key] || ''} onChange={handleCampo} />
          </div>

          {/* Propuesta de Valor */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 row-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[3].color}`}>
            <BloqueCanvas bloque={BLOQUES[3]} value={datos[BLOQUES[3].key] || ''} onChange={handleCampo} />
          </div>

          {/* Relación con Clientes */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[4].color}`}>
            <BloqueCanvas bloque={BLOQUES[4]} value={datos[BLOQUES[4].key] || ''} onChange={handleCampo} />
          </div>

          {/* Segmento de Clientes */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 row-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[6].color}`}>
            <BloqueCanvas bloque={BLOQUES[6]} value={datos[BLOQUES[6].key] || ''} onChange={handleCampo} />
          </div>

          {/* Recursos Clave */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[2].color}`}>
            <BloqueCanvas bloque={BLOQUES[2]} value={datos[BLOQUES[2].key] || ''} onChange={handleCampo} />
          </div>

          {/* Canales */}
          <div className={`col-span-10 sm:col-span-5 lg:col-span-2 rounded-2xl border-2 p-3.5 ${BLOQUES[5].color}`}>
            <BloqueCanvas bloque={BLOQUES[5]} value={datos[BLOQUES[5].key] || ''} onChange={handleCampo} />
          </div>

          {/* Fila 2: Estructura de Costos | Fuentes de Ingresos */}
          <div className={`col-span-10 lg:col-span-5 rounded-2xl border-2 p-3.5 ${BLOQUES[7].color}`}>
            <BloqueCanvas bloque={BLOQUES[7]} value={datos[BLOQUES[7].key] || ''} onChange={handleCampo} />
          </div>
          <div className={`col-span-10 lg:col-span-5 rounded-2xl border-2 p-3.5 ${BLOQUES[8].color}`}>
            <BloqueCanvas bloque={BLOQUES[8]} value={datos[BLOQUES[8].key] || ''} onChange={handleCampo} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-dark/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutGrid size={32} className="text-brand-dark" />
          </div>
          <p className="text-gray-500 font-medium mb-1">No tienes versiones de BMC aún</p>
          <p className="text-gray-400 text-sm mb-5">Crea tu primera versión para empezar a diseñar tu modelo</p>
          <button onClick={nuevaVersion} className="px-5 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 text-sm flex items-center gap-2 mx-auto font-medium shadow-sm transition-all hover:shadow-md">
            <Plus size={16} /> Crear mi primer BMC
          </button>
        </div>
      )}
    </div>
  );
};

const BloqueCanvas = ({ bloque, value, onChange }) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${bloque.accent}`}>{bloque.label}</h3>
      <p className="text-[10px] text-gray-400 mb-2 leading-tight">{bloque.desc}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(bloque.key, e.target.value)}
        placeholder="Escribe aquí..."
        className="flex-1 w-full bg-white/70 border border-gray-100 rounded-xl p-2.5 text-sm text-brand-dark resize-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan/30 outline-none min-h-[80px] placeholder:text-gray-300 transition-all"
      />
    </div>
  );
};

export default Bmc;
