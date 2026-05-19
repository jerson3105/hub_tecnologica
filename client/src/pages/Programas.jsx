import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Eye, FolderKanban, Calendar, Repeat, Rocket, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProgramas, useInvalidate } from '../hooks/useQueryHooks';

const Programas = () => {
  const { data: programas = [], isLoading: cargando } = useProgramas();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', frecuencia_seguimiento: 'semanal', estado: 'planificado'
  });

  const abrirModal = (programa = null) => {
    if (programa) {
      setEditando(programa);
      setForm({
        nombre: programa.nombre,
        descripcion: programa.descripcion || '',
        fecha_inicio: programa.fecha_inicio,
        fecha_fin: programa.fecha_fin,
        frecuencia_seguimiento: programa.frecuencia_seguimiento,
        estado: programa.estado
      });
    } else {
      setEditando(null);
      setForm({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', frecuencia_seguimiento: 'semanal', estado: 'planificado' });
    }
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/programas/${editando.id}`, form);
        toast.success('Programa actualizado');
      } else {
        await api.post('/programas', form);
        toast.success('Programa creado');
      }
      setModalOpen(false);
      invalidate('programas');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este programa?')) return;
    try {
      await api.delete(`/programas/${id}`);
      toast.success('Programa desactivado');
      invalidate('programas');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const estadoConfig = {
    en_curso: { label: 'En Curso', bg: 'bg-brand-green/15 text-brand-green', dot: 'bg-brand-green' },
    finalizado: { label: 'Finalizado', bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    planificado: { label: 'Planificado', bg: 'bg-brand-cyan/15 text-brand-dark', dot: 'bg-brand-cyan' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-cyan/10 rounded-xl"><FolderKanban size={22} className="text-brand-cyan" /></div>
            Programas
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Gestión de programas de incubación</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Plus size={18} /> Nuevo Programa
        </button>
      </div>

      {programas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} className="text-brand-cyan" />
          </div>
          <p className="text-gray-500 font-medium">No hay programas registrados</p>
          <p className="text-gray-400 text-sm mt-1">Crea tu primer programa para comenzar</p>
          <button onClick={() => abrirModal()} className="mt-5 bg-brand-dark text-white px-5 py-2 rounded-xl hover:bg-brand-dark/90 text-sm font-medium inline-flex items-center gap-2">
            <Plus size={16} /> Crear primer programa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programas.map((prog) => {
            const estado = estadoConfig[prog.estado] || estadoConfig.planificado;
            return (
              <div key={prog.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-cyan/20 transition-all duration-300">
                {/* Card top accent */}
                <div className="h-1.5 bg-gradient-to-r from-brand-cyan to-brand-green"></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-brand-dark text-lg">{prog.nombre}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${estado.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`}></span>
                      {estado.label}
                    </span>
                  </div>
                  {prog.descripcion && <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{prog.descripcion}</p>}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={13} className="text-brand-cyan" />
                      <span>{new Date(prog.fecha_inicio).toLocaleDateString('es-ES')} — {new Date(prog.fecha_fin).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Repeat size={13} className="text-brand-purple" />
                      <span className="capitalize">{prog.frecuencia_seguimiento}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Rocket size={13} className="text-brand-green" />
                      <span>{prog.emprendimientos?.length || 0} emprendimientos</span>
                    </div>
                  </div>
                  <div className="flex gap-1 border-t border-gray-50 pt-3 -mx-1">
                    <Link to={`/programas/${prog.id}`} className="flex-1 text-center py-2 text-sm text-brand-dark hover:bg-brand-cyan/10 rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors">
                      <Eye size={14} /> Ver
                    </Link>
                    <button onClick={() => abrirModal(prog)} className="flex-1 text-center py-2 text-sm text-brand-purple hover:bg-brand-purple/10 rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors">
                      <Edit size={14} /> Editar
                    </button>
                    <button onClick={() => eliminar(prog.id)} className="flex-1 text-center py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Programa' : 'Nuevo Programa'} size="lg">
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all" placeholder="Ej: Crece3G" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all resize-none" placeholder="Descripción del programa..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Fecha Inicio *</label>
              <input type="date" value={form.fecha_inicio} onChange={(e) => setForm({...form, fecha_inicio: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Fecha Fin *</label>
              <input type="date" value={form.fecha_fin} onChange={(e) => setForm({...form, fecha_fin: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Frecuencia</label>
              <select value={form.frecuencia_seguimiento} onChange={(e) => setForm({...form, frecuencia_seguimiento: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
              </select>
            </div>
            {editando && (
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
                  <option value="planificado">Planificado</option>
                  <option value="en_curso">En Curso</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 font-medium shadow-sm transition-all hover:shadow-md">{editando ? 'Actualizar' : 'Crear Programa'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Programas;
