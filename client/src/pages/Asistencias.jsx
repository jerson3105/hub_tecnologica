import { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardCheck, Check, X, Save, Users, UserCheck, UserX, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useProgramas, useEmprendimientos } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const Asistencias = () => {
  const [sesionSeleccionada, setSesionSeleccionada] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroEmprendimiento, setFiltroEmprendimiento] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listaAsistencia, setListaAsistencia] = useState([]);

  const sesParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: sesiones = [], isLoading: l1 } = useQuery({
    queryKey: ['sesiones', sesParams],
    queryFn: () => api.get('/sesiones', { params: sesParams }).then(r => r.data.sesiones)
  });
  const { data: programas = [] } = useProgramas();
  const empParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: emprendimientos = [], isLoading: l2 } = useEmprendimientos(empParams);
  const cargando = l1 || l2;

  useEffect(() => {
    if (sesionSeleccionada) {
      cargarAsistencia(sesionSeleccionada);
    }
  }, [sesionSeleccionada, filtroEmprendimiento]);

  const cargarAsistencia = async (sesionId) => {
    try {
      const res = await api.get(`/asistencias/sesion/${sesionId}`);

      // Obtener integrantes, opcionalmente filtrados por emprendimiento
      const empsFiltrados = filtroEmprendimiento
        ? emprendimientos.filter(e => e.id === parseInt(filtroEmprendimiento))
        : emprendimientos;

      const todosUsuarios = [];
      empsFiltrados.forEach(emp => {
        emp.integrantes?.forEach(int => {
          if (int.usuario && !todosUsuarios.find(u => u.id === int.usuario.id)) {
            todosUsuarios.push({ ...int.usuario, emprendimiento: emp.nombre });
          }
        });
      });

      const hayRegistrosPrevios = res.data.asistencias.length > 0;

      // Crear lista de asistencia — default to PRESENTE for new sessions
      const lista = todosUsuarios.map(usr => {
        const asistenciaExistente = res.data.asistencias.find(a => a.usuario_id === usr.id);
        return {
          usuario_id: usr.id,
          nombre: `${usr.nombre} ${usr.apellido}`,
          email: usr.email,
          emprendimiento: usr.emprendimiento,
          presente: asistenciaExistente ? asistenciaExistente.presente : (hayRegistrosPrevios ? false : true),
          observacion: asistenciaExistente?.observacion || ''
        };
      });
      setListaAsistencia(lista);
    } catch (error) {
      toast.error('Error al cargar asistencia');
    }
  };

  const toggleAsistencia = (index) => {
    const nueva = [...listaAsistencia];
    nueva[index].presente = !nueva[index].presente;
    setListaAsistencia(nueva);
  };

  const marcarTodos = (valor) => {
    setListaAsistencia(prev => prev.map(item => ({ ...item, presente: valor })));
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
      toast.success('Asistencia guardada');
    } catch (error) {
      toast.error('Error al guardar asistencia');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const totalPresentes = listaAsistencia.filter(a => a.presente).length;
  const totalAusentes = listaAsistencia.filter(a => !a.presente).length;
  const porcentaje = listaAsistencia.length > 0 ? Math.round((totalPresentes / listaAsistencia.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-cyan/10 rounded-xl"><ClipboardCheck size={22} className="text-brand-cyan" /></div>
          Asistencias
        </h1>
        <p className="text-gray-400 mt-1 ml-12">Registro de asistencia a sesiones</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLS}>Programa</label>
            <select value={filtroPrograma} onChange={(e) => { setFiltroPrograma(e.target.value); setSesionSeleccionada(''); setFiltroEmprendimiento(''); }} className={INPUT_CLS}>
              <option value="">Todos los programas</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Sesión</label>
            <select value={sesionSeleccionada} onChange={(e) => setSesionSeleccionada(e.target.value)} className={INPUT_CLS}>
              <option value="">Seleccionar sesión</option>
              {sesiones.map(s => <option key={s.id} value={s.id}>{s.titulo} - {new Date(s.fecha).toLocaleDateString('es-ES')}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Emprendimiento</label>
            <select value={filtroEmprendimiento} onChange={(e) => setFiltroEmprendimiento(e.target.value)} className={INPUT_CLS}>
              <option value="">Todos los emprendimientos</option>
              {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {sesionSeleccionada && listaAsistencia.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-green/10 rounded-lg"><UserCheck size={16} className="text-brand-green" /></div>
                  <div>
                    <p className="text-lg font-bold text-brand-green">{totalPresentes}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Presentes</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100"></div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 rounded-lg"><UserX size={16} className="text-red-400" /></div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{totalAusentes}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ausentes</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100"></div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Users size={16} className="text-brand-cyan" /></div>
                  <div>
                    <p className="text-lg font-bold text-brand-dark">{porcentaje}%</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Asistencia</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => marcarTodos(true)} className="px-3 py-1.5 text-xs text-brand-green hover:bg-brand-green/10 rounded-xl border border-brand-green/20 font-medium flex items-center gap-1 transition-colors">
                  <CheckCheck size={13} /> Todos presentes
                </button>
                <button onClick={() => marcarTodos(false)} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 rounded-xl border border-red-200/50 font-medium flex items-center gap-1 transition-colors">
                  <X size={13} /> Todos ausentes
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-brand-green transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
            </div>
          </div>

          {/* Attendance cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[11px] font-bold text-brand-dark/40 uppercase tracking-wider">Lista de asistencia</p>
              <p className="text-xs text-gray-400">{listaAsistencia.length} participante(s)</p>
            </div>
            <div className="divide-y divide-gray-50">
              {listaAsistencia.map((item, index) => (
                <div key={item.usuario_id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      item.presente ? 'bg-brand-green/15 text-brand-green' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {item.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark text-sm">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{item.email}</span>
                        {item.emprendimiento && (
                          <span className="text-[10px] text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-md font-medium">{item.emprendimiento}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAsistencia(index)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      item.presente
                        ? 'bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green/20'
                        : 'bg-red-50 text-red-400 border border-red-200/50 hover:bg-red-100/50'
                    }`}
                  >
                    {item.presente ? <><Check size={14} /> Presente</> : <><X size={14} /> Ausente</>}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={guardarAsistencia}
            disabled={guardando}
            className="w-full bg-brand-dark text-white py-3 rounded-2xl hover:bg-brand-dark/90 flex items-center justify-center gap-2 font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md text-sm"
          >
            {guardando ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={18} />}
            {guardando ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      )}

      {sesionSeleccionada && listaAsistencia.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-brand-cyan" />
          </div>
          <p className="text-gray-500 font-medium">No hay integrantes para registrar asistencia</p>
          <p className="text-xs text-gray-400 mt-1">Asegúrate de que el programa tenga emprendimientos con integrantes asignados</p>
        </div>
      )}

      {!sesionSeleccionada && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={32} className="text-brand-cyan" />
          </div>
          <p className="text-gray-500 font-medium">Selecciona una sesión para registrar asistencia</p>
          <p className="text-xs text-gray-400 mt-1">Elige un programa y sesión en los filtros de arriba</p>
        </div>
      )}
    </div>
  );
};

export default Asistencias;
