import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit, Eye, FolderKanban, Calendar, Repeat, Rocket, Archive, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProgramas, useInvalidate } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { clasesBoton } from '../components/ui/estilos';
import { ESTADOS_PROGRAMA, estadoDe } from '../constants/estados';

// Acciones del pie de cada tarjeta: botones de texto con el color de su acción, repartidos a lo ancho
const ACCION_TARJETA = { variante: 'texto', tamanio: 'lg', className: 'flex-1' };

const Programas = () => {
  const { data: programas = [], isLoading: cargando } = useProgramas();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
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
    setGuardando(true);
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
    } finally {
      setGuardando(false);
    }
  };

  // "Eliminar" en realidad desactiva (activo=false): se muestra como tal y se puede revertir
  const cambiarActivo = async (prog) => {
    if (prog.activo !== false && !confirm(`¿Desactivar el programa "${prog.nombre}"? Podrás reactivarlo después.`)) return;
    try {
      if (prog.activo === false) {
        await api.put(`/programas/${prog.id}`, { activo: true });
        toast.success('Programa reactivado');
      } else {
        await api.delete(`/programas/${prog.id}`);
        toast.success('Programa desactivado');
      }
      invalidate('programas');
    } catch {
      toast.error('No se pudo actualizar el programa');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-cyan/10 rounded-xl"><FolderKanban size={22} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            Programas
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Gestión de programas de incubación</p>
        </div>
        <Button icono={Plus} onClick={() => abrirModal()} className="self-start sm:self-auto">Nuevo Programa</Button>
      </div>

      {programas.length === 0 ? (
        <EmptyState
          icono={FolderKanban}
          tono="cyan"
          titulo="No hay programas registrados"
          descripcion="Crea tu primer programa para comenzar"
          accion={<Button icono={Plus} onClick={() => abrirModal()}>Crear primer programa</Button>}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programas.map((prog) => {
            const estado = estadoDe(ESTADOS_PROGRAMA, prog.estado, ESTADOS_PROGRAMA.planificado);
            return (
              <li key={prog.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-cyan/20 transition-all duration-300">
                {/* Card top accent */}
                <div className="h-1.5 bg-gradient-to-r from-brand-cyan to-brand-green" aria-hidden="true"></div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-brand-dark text-lg min-w-0 break-words">
                      {prog.nombre}
                      {prog.activo === false && <Badge className="ml-2 align-middle">Inactivo</Badge>}
                    </h3>
                    <Badge tono={estado.tono} punto className="shrink-0 whitespace-nowrap">{estado.label}</Badge>
                  </div>
                  {prog.descripcion && <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{prog.descripcion}</p>}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={13} className="text-brand-cyan-ink shrink-0" aria-hidden="true" />
                      <span>{formatFecha(prog.fecha_inicio)} — {formatFecha(prog.fecha_fin)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Repeat size={13} className="text-brand-purple shrink-0" aria-hidden="true" />
                      <span className="capitalize">{prog.frecuencia_seguimiento}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Rocket size={13} className="text-brand-green-ink shrink-0" aria-hidden="true" />
                      <span>{prog.emprendimientos?.length || 0} emprendimientos</span>
                    </div>
                  </div>
                  <div className="flex gap-1 border-t border-gray-50 pt-3 -mx-1">
                    <Link to={`/programas/${prog.id}`} aria-label={`Ver programa ${prog.nombre}`} className={clasesBoton({ ...ACCION_TARJETA, tono: 'brand' })}>
                      <Eye size={16} aria-hidden="true" /> Ver
                    </Link>
                    <Button {...ACCION_TARJETA} tono="purple" icono={Edit} onClick={() => abrirModal(prog)} aria-label={`Editar programa ${prog.nombre}`}>Editar</Button>
                    {prog.activo === false ? (
                      <Button {...ACCION_TARJETA} tono="success" icono={RotateCcw} onClick={() => cambiarActivo(prog)} aria-label={`Reactivar programa ${prog.nombre}`}>Reactivar</Button>
                    ) : (
                      <Button {...ACCION_TARJETA} tono="danger" icono={Archive} onClick={() => cambiarActivo(prog)} aria-label={`Desactivar programa ${prog.nombre}`}>Desactivar</Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Programa' : 'Nuevo Programa'} size="lg">
        <form onSubmit={guardar} className="space-y-5">
          <Field label="Nombre" requerido>
            <Input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Ej: Crece3G" />
          </Field>
          <Field label="Descripción">
            <Textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} rows={3} className="resize-y" placeholder="Descripción del programa..." />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha de inicio" requerido>
              <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({...form, fecha_inicio: e.target.value})} />
            </Field>
            <Field label="Fecha de fin" requerido>
              <Input type="date" value={form.fecha_fin} min={form.fecha_inicio || undefined} onChange={(e) => setForm({...form, fecha_fin: e.target.value})} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Frecuencia de seguimiento">
              <Select value={form.frecuencia_seguimiento} onChange={(e) => setForm({...form, frecuencia_seguimiento: e.target.value})}>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
              </Select>
            </Field>
            {editando && (
              <Field label="Estado">
                <Select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})}>
                  {Object.entries(ESTADOS_PROGRAMA).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <Button variante="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" cargando={guardando}>{editando ? 'Actualizar' : 'Crear Programa'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Programas;
