import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { ClipboardCheck, Check, X, Save, Users, UserCheck, UserX, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useProgramas, useEmprendimientos } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Field, Select } from '../components/ui/Field';

// Programas a los que pertenece la sesión (multi-programa o legacy con programa_id)
const programasDeSesion = (sesion) => {
  if (!sesion) return [];
  if (sesion.programas?.length) return sesion.programas.map(p => p.id);
  return sesion.programa_id ? [sesion.programa_id] : [];
};

const Asistencias = () => {
  // ?sesion= preselecciona la sesión (enlace «Tomar asistencia» del Inicio)
  const [searchParams] = useSearchParams();
  const [sesionSeleccionada, setSesionSeleccionada] = useState(() => searchParams.get('sesion') || '');
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroEmprendimiento, setFiltroEmprendimiento] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listaAsistencia, setListaAsistencia] = useState([]);
  const [hayCambios, setHayCambios] = useState(false);

  const sesParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: sesiones = [], isLoading: l1 } = useQuery({
    queryKey: ['sesiones', sesParams],
    queryFn: () => api.get('/sesiones', { params: sesParams }).then(r => r.data.sesiones)
  });
  const { data: programas = [] } = useProgramas();
  const empParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: emprendimientos = [], isLoading: l2 } = useEmprendimientos(empParams);
  const cargando = l1 || l2;

  const sesion = sesiones.find(s => String(s.id) === String(sesionSeleccionada));

  // Solo los emprendimientos de los programas de la sesión: antes, sin filtro de programa,
  // la lista incluía a toda la incubadora y se registraba como presente a gente ajena.
  const emprendimientosSesion = useMemo(() => {
    const ids = programasDeSesion(sesion);
    return emprendimientos.filter(e => ids.includes(e.programa_id ?? e.programa?.id));
  }, [sesion, emprendimientos]);

  const roster = useMemo(() => {
    const emps = filtroEmprendimiento
      ? emprendimientosSesion.filter(e => e.id === parseInt(filtroEmprendimiento))
      : emprendimientosSesion;
    const usuarios = [];
    emps.forEach(emp => {
      emp.integrantes?.forEach(int => {
        if (int.usuario && !usuarios.find(u => u.id === int.usuario.id)) {
          usuarios.push({ ...int.usuario, emprendimiento: emp.nombre });
        }
      });
    });
    return usuarios;
  }, [emprendimientosSesion, filtroEmprendimiento]);

  useEffect(() => {
    if (!sesionSeleccionada) return undefined;
    let cancelado = false;

    api.get(`/asistencias/sesion/${sesionSeleccionada}`)
      .then(res => {
        if (cancelado) return;
        const registros = res.data.asistencias;
        const hayRegistrosPrevios = registros.length > 0;
        // Sesión nueva: todos presentes por defecto; con registros previos, ausente si no figura
        setListaAsistencia(roster.map(usr => {
          const existente = registros.find(a => a.usuario_id === usr.id);
          return {
            usuario_id: usr.id,
            nombre: `${usr.nombre} ${usr.apellido}`,
            email: usr.email,
            emprendimiento: usr.emprendimiento,
            presente: existente ? existente.presente : !hayRegistrosPrevios,
            observacion: existente?.observacion || ''
          };
        }));
        setHayCambios(false);
      })
      .catch(() => { if (!cancelado) toast.error('Error al cargar asistencia'); });

    return () => { cancelado = true; };
  }, [sesionSeleccionada, roster]);

  const confirmarDescartar = () => !hayCambios || window.confirm('Tienes cambios de asistencia sin guardar. ¿Descartarlos?');

  const cambiarSesion = (valor) => {
    if (!confirmarDescartar()) return;
    setSesionSeleccionada(valor);
    setFiltroEmprendimiento('');
    if (!valor) setListaAsistencia([]);
  };

  const toggleAsistencia = (usuarioId) => {
    setListaAsistencia(prev => prev.map(item => (item.usuario_id === usuarioId ? { ...item, presente: !item.presente } : item)));
    setHayCambios(true);
  };

  const marcarTodos = (valor) => {
    setListaAsistencia(prev => prev.map(item => ({ ...item, presente: valor })));
    setHayCambios(true);
  };

  const guardarAsistencia = async () => {
    if (!sesionSeleccionada) {
      toast.error('Selecciona una sesión');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/asistencias', {
        sesion_id: parseInt(sesionSeleccionada),
        asistencias: listaAsistencia.map(a => ({
          usuario_id: a.usuario_id,
          presente: a.presente,
          observacion: a.observacion
        }))
      });
      setHayCambios(false);
      toast.success('Asistencia guardada');
    } catch {
      toast.error('Error al guardar asistencia');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const totalPresentes = listaAsistencia.filter(a => a.presente).length;
  const totalAusentes = listaAsistencia.filter(a => !a.presente).length;
  const porcentaje = listaAsistencia.length > 0 ? Math.round((totalPresentes / listaAsistencia.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-cyan/10 rounded-xl"><ClipboardCheck size={22} className="text-brand-cyan-ink" aria-hidden="true" /></div>
          Asistencias
        </h1>
        <p className="text-gray-500 mt-1 sm:ml-12">Registro de asistencia a sesiones</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Programa">
            <Select
              value={filtroPrograma}
              onChange={(e) => {
                if (!confirmarDescartar()) return;
                setFiltroPrograma(e.target.value);
                setSesionSeleccionada('');
                setFiltroEmprendimiento('');
                setListaAsistencia([]);
              }}
            >
              <option value="">Todos los programas</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Sesión">
            <Select value={sesionSeleccionada} onChange={(e) => cambiarSesion(e.target.value)}>
              <option value="">Seleccionar sesión</option>
              {sesiones.map(s => <option key={s.id} value={s.id}>{s.titulo} - {formatFecha(s.fecha)}</option>)}
            </Select>
          </Field>
          <Field label="Emprendimiento">
            <Select
              value={filtroEmprendimiento}
              onChange={(e) => setFiltroEmprendimiento(e.target.value)}
              disabled={!sesionSeleccionada}
            >
              <option value="">Todos los de la sesión</option>
              {emprendimientosSesion.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      {/* Attendance List */}
      {sesionSeleccionada && listaAsistencia.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-green/10 rounded-lg"><UserCheck size={16} className="text-brand-green-ink" aria-hidden="true" /></div>
                  <div>
                    <p className="text-lg font-bold text-brand-green-ink tabular-nums">{totalPresentes}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Presentes</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100" aria-hidden="true"></div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 rounded-lg"><UserX size={16} className="text-red-600" aria-hidden="true" /></div>
                  <div>
                    <p className="text-lg font-bold text-red-700 tabular-nums">{totalAusentes}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Ausentes</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100" aria-hidden="true"></div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Users size={16} className="text-brand-cyan-ink" aria-hidden="true" /></div>
                  <div>
                    <p className="text-lg font-bold text-brand-dark tabular-nums">{porcentaje}%</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Asistencia</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variante="texto" tono="success" tamanio="sm" icono={CheckCheck} onClick={() => marcarTodos(true)} className="border border-brand-green/40">Todos presentes</Button>
                <Button variante="texto" tono="danger" tamanio="sm" icono={X} onClick={() => marcarTodos(false)} className="border border-red-200">Todos ausentes</Button>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Porcentaje de asistencia">
              <div className="h-2 rounded-full bg-brand-green transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
            </div>
          </div>

          {/* Attendance cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="eyebrow">Lista de asistencia</p>
              <p className="text-xs text-gray-500">{listaAsistencia.length} participante(s)</p>
            </div>
            <div className="divide-y divide-gray-50">
              {listaAsistencia.map((item) => (
                <div key={item.usuario_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ${
                      item.presente ? 'bg-brand-green/15 text-brand-green-ink' : 'bg-gray-100 text-gray-500'
                    }`} aria-hidden="true">
                      {item.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-dark text-sm">{item.nombre}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 break-all">{item.email}</span>
                        {item.emprendimiento && (
                          <Badge tono="purple" forma="tag">{item.emprendimiento}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAsistencia(item.usuario_id)}
                    aria-pressed={item.presente}
                    aria-label={`${item.nombre}: ${item.presente ? 'presente' : 'ausente'}. Cambiar`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      item.presente
                        ? 'bg-brand-green/10 text-brand-green-ink border border-brand-green/40 hover:bg-brand-green/20'
                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/50'
                    }`}
                  >
                    {item.presente ? <><Check size={14} aria-hidden="true" /> Presente</> : <><X size={14} aria-hidden="true" /> Ausente</>}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <Button
            tamanio="lg"
            icono={Save}
            cargando={guardando}
            onClick={guardarAsistencia}
            className="w-full"
          >
            {guardando ? 'Guardando...' : hayCambios ? 'Guardar Asistencia (cambios sin guardar)' : 'Guardar Asistencia'}
          </Button>
        </div>
      )}

      {sesionSeleccionada && listaAsistencia.length === 0 && (
        <EmptyState
          icono={Users}
          tono="cyan"
          titulo="No hay integrantes para registrar asistencia"
          descripcion="Los programas de esta sesión no tienen emprendimientos con integrantes asignados"
        />
      )}

      {!sesionSeleccionada && (
        <EmptyState
          icono={ClipboardCheck}
          tono="cyan"
          titulo="Selecciona una sesión para registrar asistencia"
          descripcion="Elige un programa y sesión en los filtros de arriba"
        />
      )}
    </div>
  );
};

export default Asistencias;
