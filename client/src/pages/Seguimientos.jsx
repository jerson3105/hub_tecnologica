import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, ClipboardList, Video, CalendarDays, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useEmprendimientos, useSesiones, useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const Seguimientos = () => {
  const { data: emprendimientos = [], isLoading: l1 } = useEmprendimientos();
  const { data: sesiones = [] } = useSesiones();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroEmprendimiento, setFiltroEmprendimiento] = useState('');
  const [form, setForm] = useState({
    sesion_id: '', emprendimiento_ids: [], emprendimiento_id: '', realizado: '', compromisos: '', observaciones: '', estado_avance: 'en_progreso', enlace_grabacion: ''
  });

  // Auto-select first emprendimiento when data loads
  useEffect(() => {
    if (!filtroEmprendimiento && emprendimientos.length > 0) {
      setFiltroEmprendimiento(emprendimientos[0].id.toString());
    }
  }, [emprendimientos]);
  const empId = filtroEmprendimiento || (emprendimientos.length > 0 ? emprendimientos[0].id.toString() : '');

  const { data: seguimientos = [], isLoading: l2 } = useQuery({
    queryKey: ['seguimientos', empId],
    queryFn: () => api.get(`/seguimientos/emprendimiento/${empId}`).then(r => r.data.seguimientos),
    enabled: !!empId
  });
  const cargando = l1 || l2;

  const toggleEmprendimiento = (empId) => {
    setForm(prev => {
      const ids = prev.emprendimiento_ids.includes(empId)
        ? prev.emprendimiento_ids.filter(id => id !== empId)
        : [...prev.emprendimiento_ids, empId];
      return { ...prev, emprendimiento_ids: ids };
    });
  };

  const abrirModal = (seg = null) => {
    if (seg) {
      setEditando(seg);
      setForm({
        sesion_id: seg.sesion_id || seg.sesion?.id,
        emprendimiento_ids: [],
        emprendimiento_id: seg.emprendimiento_id || seg.emprendimiento?.id,
        realizado: seg.realizado || '',
        compromisos: seg.compromisos || '',
        observaciones: seg.observaciones || '',
        estado_avance: seg.estado_avance,
        enlace_grabacion: seg.enlace_grabacion || ''
      });
    } else {
      setEditando(null);
      setForm({
        sesion_id: sesiones[0]?.id || '',
        emprendimiento_ids: filtroEmprendimiento ? [parseInt(filtroEmprendimiento)] : [],
        emprendimiento_id: '',
        realizado: '', compromisos: '', observaciones: '', estado_avance: 'en_progreso', enlace_grabacion: ''
      });
    }
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/seguimientos/${editando.id}`, form);
        toast.success('Seguimiento actualizado');
      } else {
        if (form.emprendimiento_ids.length === 0) {
          toast.error('Selecciona al menos un emprendimiento');
          return;
        }
        const res = await api.post('/seguimientos', {
          sesion_id: form.sesion_id,
          emprendimiento_ids: form.emprendimiento_ids,
          realizado: form.realizado,
          compromisos: form.compromisos,
          observaciones: form.observaciones,
          estado_avance: form.estado_avance,
          enlace_grabacion: form.enlace_grabacion
        });
        toast.success(res.data.mensaje);
        if (res.data.errores?.length > 0) {
          res.data.errores.forEach(err => toast.error(err, { duration: 5000 }));
        }
      }
      setModalOpen(false);
      invalidate('seguimientos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este seguimiento?')) return;
    try {
      await api.delete(`/seguimientos/${id}`);
      toast.success('Seguimiento eliminado');
      invalidate('seguimientos');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const estadoMap = {
    sin_iniciar: { label: 'Sin Iniciar', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    en_progreso: { label: 'En Progreso', color: 'bg-brand-cyan/15 text-brand-dark', dot: 'bg-brand-cyan' },
    avanzado: { label: 'Avanzado', color: 'bg-brand-green/15 text-brand-green', dot: 'bg-brand-green' },
    completado: { label: 'Completado', color: 'bg-brand-green/20 text-brand-green', dot: 'bg-brand-green' }
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
            <div className="p-2 bg-brand-purple/10 rounded-xl"><ClipboardList size={22} className="text-brand-purple" /></div>
            Seguimiento
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Registro de avances por emprendimiento</p>
        </div>
        <div className="flex gap-3">
          <select value={filtroEmprendimiento} onChange={(e) => setFiltroEmprendimiento(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Seleccionar emprendimiento</option>
            {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button onClick={() => abrirModal()} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm transition-all hover:shadow-md">
            <Plus size={18} /> Registrar
          </button>
        </div>
      </div>

      {/* Timeline de seguimientos */}
      {seguimientos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-brand-purple" />
          </div>
          <p className="text-gray-500 font-medium">No hay registros de seguimiento</p>
          <p className="text-gray-400 text-sm mt-1">Registra el primer avance para este emprendimiento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seguimientos.map((seg, index) => {
            const est = estadoMap[seg.estado_avance] || estadoMap.sin_iniciar;
            return (
              <div key={seg.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-cyan/20 transition-all duration-200 relative">
                <div className="h-1 bg-gradient-to-r from-brand-purple to-brand-cyan"></div>
                {index < seguimientos.length - 1 && (
                  <div className="absolute left-8 top-full w-0.5 h-4 bg-brand-cyan/20"></div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-brand-purple/10 rounded-xl shrink-0 mt-0.5">
                        <CalendarDays size={16} className="text-brand-purple" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{seg.sesion?.titulo}</p>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
                          <span>{seg.sesion?.fecha ? new Date(seg.sesion.fecha).toLocaleDateString('es-ES') : ''}</span>
                          {seg.sesion?.programa?.nombre && (
                            <>
                              <span className="text-gray-300">·</span>
                              <FolderKanban size={12} className="text-brand-cyan" />
                              <span>{seg.sesion?.programa?.nombre}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${est.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`}></span>
                        {est.label}
                      </span>
                      <button onClick={() => abrirModal(seg)} className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-colors"><Edit size={15} /></button>
                      <button onClick={() => eliminar(seg.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {seg.realizado && (
                    <div className="mb-3 p-4 bg-brand-green/5 border border-brand-green/10 rounded-xl">
                      <p className="text-[10px] font-bold text-brand-green uppercase tracking-wider mb-1">Lo realizado</p>
                      <p className="text-sm text-gray-700">{seg.realizado}</p>
                    </div>
                  )}
                  {seg.compromisos && (
                    <div className="mb-3 p-4 bg-brand-cyan/5 border border-brand-cyan/10 rounded-xl">
                      <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider mb-1">Compromisos</p>
                      <p className="text-sm text-gray-700">{seg.compromisos}</p>
                    </div>
                  )}
                  {seg.observaciones && (
                    <div className="mb-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Observaciones</p>
                      <p className="text-sm text-gray-700">{seg.observaciones}</p>
                    </div>
                  )}
                  {seg.enlace_grabacion && (
                    <div className="mt-3 flex items-center gap-2 bg-brand-cyan/5 border border-brand-cyan/10 rounded-xl px-3 py-2 w-fit">
                      <Video size={14} className="text-brand-cyan" />
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-dark hover:text-brand-cyan font-medium transition-colors break-all">
                        Grabación de la reunión
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Seguimiento' : 'Registrar Seguimiento'} size="lg">
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className={LABEL_CLS}>Sesión *</label>
            <select value={form.sesion_id} onChange={(e) => setForm({...form, sesion_id: e.target.value})} required className={INPUT_CLS}>
              <option value="">Seleccionar sesión</option>
              {sesiones.map(s => <option key={s.id} value={s.id}>{s.titulo} ({new Date(s.fecha).toLocaleDateString('es-ES')})</option>)}
            </select>
          </div>
          {editando ? (
            <div>
              <label className={LABEL_CLS}>Emprendimiento</label>
              <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">{emprendimientos.find(e => e.id == form.emprendimiento_id)?.nombre || '-'}</p>
            </div>
          ) : (
            <div>
              <label className={LABEL_CLS}>Emprendimientos * <span className="text-xs text-gray-400 font-normal">(selecciona uno o más)</span></label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                {emprendimientos.map(emp => (
                  <label key={emp.id} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-brand-cyan/5 transition-colors ${form.emprendimiento_ids.includes(emp.id) ? 'bg-brand-cyan/10 border border-brand-cyan/20' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.emprendimiento_ids.includes(emp.id)}
                      onChange={() => toggleEmprendimiento(emp.id)}
                      className="rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan"
                    />
                    <span className="text-sm text-brand-dark font-medium">{emp.nombre}</span>
                    <span className="text-xs text-gray-400 ml-auto">{emp.programa?.nombre}</span>
                  </label>
                ))}
              </div>
              {form.emprendimiento_ids.length > 0 && (
                <p className="text-xs text-brand-cyan font-semibold mt-1.5">{form.emprendimiento_ids.length} emprendimiento(s) seleccionado(s)</p>
              )}
            </div>
          )}
          <div>
            <label className={LABEL_CLS}>Lo realizado en la sesión</label>
            <textarea value={form.realizado} onChange={(e) => setForm({...form, realizado: e.target.value})} rows={3} className={`${INPUT_CLS} resize-none`} placeholder="Describir lo realizado..." />
          </div>
          <div>
            <label className={LABEL_CLS}>Compromisos para siguiente sesión</label>
            <textarea value={form.compromisos} onChange={(e) => setForm({...form, compromisos: e.target.value})} rows={3} className={`${INPUT_CLS} resize-none`} placeholder="Compromisos acordados..." />
          </div>
          <div>
            <label className={LABEL_CLS}>Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => setForm({...form, observaciones: e.target.value})} rows={2} className={`${INPUT_CLS} resize-none`} />
          </div>
          <div>
            <label className={LABEL_CLS}>Estado de Avance</label>
            <select value={form.estado_avance} onChange={(e) => setForm({...form, estado_avance: e.target.value})} className={INPUT_CLS}>
              <option value="sin_iniciar">Sin Iniciar</option>
              <option value="en_progreso">En Progreso</option>
              <option value="avanzado">Avanzado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Enlace de Grabación <span className="text-xs text-gray-400 font-normal">(reunión 1 a 1)</span></label>
            <input type="url" value={form.enlace_grabacion} onChange={(e) => setForm({...form, enlace_grabacion: e.target.value})} placeholder="https://meet.google.com/... o https://zoom.us/..." className={INPUT_CLS} />
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 font-medium shadow-sm transition-all hover:shadow-md">{editando ? 'Actualizar' : 'Registrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Seguimientos;
