import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Eye, CalendarDays, Video, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useProgramas, useNpsPromedios, useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const Sesiones = () => {
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [form, setForm] = useState({
    programa_id: '', titulo: '', descripcion: '', fecha: '', tipo: 'uno_a_uno_programa', enlace_grabacion: ''
  });

  const sesParams = {};
  if (filtroPrograma) sesParams.programa_id = filtroPrograma;
  if (filtroTipo) sesParams.tipo = filtroTipo;

  const { data: sesiones = [], isLoading: l1 } = useQuery({
    queryKey: ['sesiones', sesParams],
    queryFn: () => api.get('/sesiones', { params: sesParams }).then(r => r.data.sesiones)
  });
  const { data: programas = [], isLoading: l2 } = useProgramas();
  const { data: npsPromedios = {} } = useNpsPromedios();
  const { data: npsPendientesArr = [] } = useQuery({
    queryKey: ['npsPendientes'],
    queryFn: () => api.get('/nps/mis-pendientes').then(r => r.data.pendientes || []).catch(() => []),
    enabled: !esAdmin
  });
  const npsPendientes = new Set(npsPendientesArr);
  const cargando = l1 || l2;

  const abrirModal = (sesion = null) => {
    if (sesion) {
      setEditando(sesion);
      setForm({
        programa_id: sesion.programa_id || sesion.programa?.id,
        titulo: sesion.titulo,
        descripcion: sesion.descripcion || '',
        fecha: sesion.fecha,
        tipo: sesion.tipo,
        enlace_grabacion: sesion.enlace_grabacion || ''
      });
    } else {
      setEditando(null);
      setForm({ programa_id: programas[0]?.id || '', titulo: '', descripcion: '', fecha: '', tipo: 'uno_a_uno_programa', enlace_grabacion: '' });
    }
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/sesiones/${editando.id}`, form);
        toast.success('Sesión actualizada');
      } else {
        await api.post('/sesiones', form);
        toast.success('Sesión creada');
      }
      setModalOpen(false);
      invalidate('sesiones', 'timeline');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta sesión?')) return;
    try {
      await api.delete(`/sesiones/${id}`);
      toast.success('Sesión eliminada');
      invalidate('sesiones', 'timeline');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-purple/10 rounded-xl"><CalendarDays size={22} className="text-brand-purple" /></div>
            Sesiones
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Sesiones de seguimiento y talleres</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={filtroPrograma} onChange={(e) => setFiltroPrograma(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Todos los programas</option>
            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Todos los tipos</option>
            <option value="diagnostica_1">Diagnóstica 1</option>
            <option value="diagnostica_2">Diagnóstica 2</option>
            <option value="diagnostica_final">Diagnóstica Final</option>
            <option value="taller">Taller</option>
            <option value="uno_a_uno_programa">1 a 1 Programa</option>
            <option value="uno_a_uno_taller">1 a 1 Taller</option>
            <option value="seguimiento">Seguimiento (legacy)</option>
          </select>
          {esAdmin && (
            <button onClick={() => abrirModal()} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm transition-all hover:shadow-md">
              <Plus size={18} /> Nueva Sesión
            </button>
          )}
        </div>
      </div>

      {sesiones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={32} className="text-brand-purple" />
          </div>
          <p className="text-gray-500 font-medium">No hay sesiones registradas</p>
          <p className="text-gray-400 text-sm mt-1">Crea tu primera sesión para comenzar</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Título</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Programa</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Tipo</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Grabación</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">{esAdmin ? 'NPS' : 'Evaluación'}</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((ses) => (
                  <tr key={ses.id} className="border-t border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-brand-dark">{ses.titulo}</td>
                    <td className="py-3.5 px-4 text-gray-500">{ses.programa?.nombre}</td>
                    <td className="py-3.5 px-4 text-gray-500">{new Date(ses.fecha).toLocaleDateString('es-ES')}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        ses.tipo === 'taller' ? 'bg-blue-100 text-blue-700' :
                        ses.tipo === 'uno_a_uno_programa' ? 'bg-cyan-100 text-cyan-700' :
                        ses.tipo === 'uno_a_uno_taller' ? 'bg-green-100 text-green-700' :
                        ses.tipo?.startsWith('diagnostica') ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{
                        ses.tipo === 'diagnostica_1' ? 'Diagnóstica 1' :
                        ses.tipo === 'diagnostica_2' ? 'Diagnóstica 2' :
                        ses.tipo === 'diagnostica_final' ? 'Diagnóstica Final' :
                        ses.tipo === 'taller' ? 'Taller' :
                        ses.tipo === 'uno_a_uno_programa' ? '1 a 1 Programa' :
                        ses.tipo === 'uno_a_uno_taller' ? '1 a 1 Taller' :
                        'Seguimiento'
                      }</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {ses.enlace_grabacion ? (
                        <a href={ses.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:text-brand-dark flex items-center gap-1 font-medium transition-colors">
                          <Video size={14} /> Ver
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {esAdmin ? (
                        npsPromedios[ses.id] ? (
                          <Link to={`/sesiones/${ses.id}/nps`} className="flex items-center gap-1 text-amber-500 hover:text-amber-600" title={`${npsPromedios[ses.id].total} evaluaciones`}>
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold">{npsPromedios[ses.id].promedio}</span>
                            <span className="text-[10px] text-gray-400">({npsPromedios[ses.id].total})</span>
                          </Link>
                        ) : (
                          <span className="text-gray-300 text-xs">Sin evaluar</span>
                        )
                      ) : (
                        npsPendientes.has(ses.id) ? (
                          <Link to={`/sesiones/${ses.id}`} className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-semibold w-fit">
                            <AlertCircle size={12} /> Pendiente
                          </Link>
                        ) : (
                          <span className="flex items-center gap-1 text-brand-green text-xs font-semibold"><Star size={12} fill="currentColor" /> Enviado</span>
                        )
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/sesiones/${ses.id}`} className="p-2 text-brand-dark hover:bg-brand-cyan/10 rounded-xl transition-colors"><Eye size={15} /></Link>
                        {esAdmin && (
                          <>
                            <button onClick={() => abrirModal(ses)} className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-colors"><Edit size={15} /></button>
                            <button onClick={() => eliminar(ses.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Sesión' : 'Nueva Sesión'} size="lg">
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className={LABEL_CLS}>Programa *</label>
            <select value={form.programa_id} onChange={(e) => setForm({...form, programa_id: e.target.value})} required className={INPUT_CLS}>
              <option value="">Seleccionar programa</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Título *</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} required className={INPUT_CLS} placeholder="Ej: Sesión de seguimiento #1" />
          </div>
          <div>
            <label className={LABEL_CLS}>Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} rows={3} className={`${INPUT_CLS} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})} required className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} className={INPUT_CLS}>
                <option value="diagnostica_1">Diagnóstica 1</option>
                <option value="diagnostica_2">Diagnóstica 2</option>
                <option value="diagnostica_final">Diagnóstica Final</option>
                <option value="taller">Taller</option>
                <option value="uno_a_uno_programa">1 a 1 Programa</option>
                <option value="uno_a_uno_taller">1 a 1 Taller</option>
                <option value="seguimiento">Seguimiento (legacy)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Enlace de Grabación</label>
            <input type="url" value={form.enlace_grabacion} onChange={(e) => setForm({...form, enlace_grabacion: e.target.value})} className={INPUT_CLS} placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 font-medium shadow-sm transition-all hover:shadow-md">{editando ? 'Actualizar' : 'Crear Sesión'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sesiones;
