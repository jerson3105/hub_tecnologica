import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { useEmprendimientos } from '../../hooks/useQueryHooks';

// Asignar a un emprendedor sin equipo a un emprendimiento (cada emprendedor pertenece a uno).
// Para cambiarlo de equipo se le quita primero del actual. `onAsignado` se llama tras guardar.
const AsignarEmprendimiento = ({ usuario, onAsignado }) => {
  const { data: emprendimientos = [], isLoading } = useEmprendimientos();
  const [form, setForm] = useState({ emprendimiento_id: '', rol_emprendimiento: '', es_lider: false });
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const opciones = emprendimientos
    .filter((e) => e.estado !== 'retirado')
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const error = intentado && !form.emprendimiento_id ? 'Elige el emprendimiento' : null;

  const asignar = async (e) => {
    e.preventDefault();
    setIntentado(true);
    if (!form.emprendimiento_id) return;
    setGuardando(true);
    try {
      await api.post(`/emprendimientos/${form.emprendimiento_id}/integrantes`, {
        usuario_id: usuario.id,
        rol_emprendimiento: form.rol_emprendimiento.trim(),
        es_lider: form.es_lider
      });
      toast.success('Asignado al emprendimiento');
      onAsignado?.();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No se pudo asignar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={asignar} className="grid gap-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Emprendimiento" error={error}>
          <Select value={form.emprendimiento_id} onChange={(e) => setForm((f) => ({ ...f, emprendimiento_id: e.target.value }))} disabled={isLoading}>
            <option value="">{isLoading ? 'Cargando…' : 'Elegir emprendimiento'}</option>
            {opciones.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}{e.programa?.nombre ? ` · ${e.programa.nombre}` : ''}</option>
            ))}
          </Select>
        </Field>
        <Field label="Rol en el equipo">
          <Input value={form.rol_emprendimiento} onChange={(e) => setForm((f) => ({ ...f, rol_emprendimiento: e.target.value }))} placeholder="Ej: Cofundadora" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={form.es_lider} onChange={(e) => setForm((f) => ({ ...f, es_lider: e.target.checked }))} className="size-4 accent-[var(--primary)]" />
          Es líder del emprendimiento
        </label>
        <Button type="submit" variante="secondary" tamanio="sm" icono={UserPlus} cargando={guardando}>Asignar</Button>
      </div>
    </form>
  );
};

export default AsignarEmprendimiento;
