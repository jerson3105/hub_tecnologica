import { useEffect, useState } from 'react';
import { Search, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import IntegranteFields from '../IntegranteFields';
import Button from '../ui/Button';
import Segmentado from '../ui/Segmentado';
import Skeleton from '../ui/Skeleton';
import { Field, Input } from '../ui/Field';
import { DATOS_INTEGRANTE_VACIOS } from '../../constants/integrantes';

const VACIO = { ...DATOS_INTEGRANTE_VACIOS, rol_emprendimiento: '', es_lider: false };
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Agregar un integrante: asignar un usuario emprendedor que ya existe (y no tiene equipo) o crear
// uno nuevo. Se monta al abrirse. `onGuardado` se llama tras guardar.
const IntegranteModal = ({ emprendimiento, onClose, onGuardado }) => {
  const [modo, setModo] = useState('existente');
  const [form, setForm] = useState(VACIO);
  const [disponibles, setDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    api.get(`/emprendimientos/${emprendimiento.id}/usuarios-disponibles`)
      .then((res) => {
        if (cancelado) return;
        const usuarios = res.data.usuarios || [];
        setDisponibles(usuarios);
        if (usuarios.length === 0) setModo('nuevo');
      })
      .catch((error) => {
        if (cancelado) return;
        setModo('nuevo');
        toast.error(error.response?.data?.mensaje || 'No se pudo cargar la lista de usuarios');
      })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [emprendimiento.id]);

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const texto = normalizar(busqueda.trim());
  const filtrados = disponibles.filter((u) => !texto || normalizar(`${u.nombre} ${u.apellido} ${u.email}`).includes(texto));
  const seleccionado = disponibles.find((u) => String(u.id) === String(seleccionadoId));

  const guardar = async (e) => {
    e.preventDefault();
    if (modo === 'existente' && !seleccionadoId) {
      toast.error('Selecciona un usuario emprendedor para asignarlo');
      return;
    }
    if (modo === 'nuevo' && (!form.nombre || !form.apellido || !form.email)) {
      toast.error('Nombre, apellido y correo son requeridos');
      return;
    }
    setGuardando(true);
    try {
      const payload = modo === 'existente'
        ? { usuario_id: seleccionadoId, rol_emprendimiento: form.rol_emprendimiento, es_lider: form.es_lider }
        : form;
      await api.post(`/emprendimientos/${emprendimiento.id}/integrantes`, payload);
      toast.success(modo === 'existente' ? 'Usuario asignado' : 'Integrante agregado');
      onGuardado?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al agregar integrante');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title="Agregar integrante" descripcion={`Al equipo de ${emprendimiento.nombre}`}>
      <form onSubmit={guardar} className="space-y-6">
        <Segmentado
          etiqueta="Forma de agregar el integrante"
          valor={modo}
          onCambiar={setModo}
          className="w-full"
          opciones={[
            { valor: 'existente', texto: 'Usuario existente' },
            { valor: 'nuevo', texto: 'Crear usuario nuevo' }
          ]}
        />

        {modo === 'existente' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Emprendedores ya registrados que aún no pertenecen a ningún equipo. Los administradores no aparecen.
            </p>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo"
                aria-label="Buscar usuario"
                className="pl-9"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-card border border-border p-1.5" role="radiogroup" aria-label="Usuarios disponibles">
              {cargando ? (
                <div className="grid gap-2 p-1.5" role="status" aria-label="Cargando usuarios">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : filtrados.length > 0 ? (
                filtrados.map((u) => {
                  const activo = String(u.id) === String(seleccionadoId);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      onClick={() => setSeleccionadoId(String(u.id))}
                      className={`flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors ${
                        activo ? 'bg-info-soft' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold" aria-hidden="true">
                        {u.nombre?.[0]}{u.apellido?.[0]}
                      </span>
                      <span className="grid min-w-0 flex-1">
                        <span className="text-sm font-semibold">{u.nombre} {u.apellido}</span>
                        <span className="truncate text-[13px] text-muted-foreground">
                          {[u.email, u.cargo].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${activo ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                        aria-hidden="true"
                      >
                        {activo && <Check size={12} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {disponibles.length === 0 ? 'No hay emprendedores sin equipo. Crea un usuario nuevo.' : 'Ningún usuario coincide con la búsqueda.'}
                </p>
              )}
            </div>
            {seleccionado && (
              <p className="text-sm" aria-live="polite">
                Se asignará a <span className="font-semibold">{seleccionado.nombre} {seleccionado.apellido}</span> con su perfil actual.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si el correo ya existe y es de un emprendedor sin equipo, se vinculará a ese usuario.
            </p>
            <IntegranteFields valores={form} onCambio={setCampo} requerido />
          </div>
        )}

        <fieldset className="grid gap-4 border-t border-border pt-5">
          <legend className="sr-only">Rol en el emprendimiento</legend>
          <Field label="Rol en el emprendimiento">
            <Input type="text" value={form.rol_emprendimiento} onChange={(e) => setCampo('rol_emprendimiento', e.target.value)} placeholder="Ej: Cofundadora, Desarrollador" />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-3 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              checked={form.es_lider}
              onChange={(e) => setCampo('es_lider', e.target.checked)}
              aria-describedby="ayuda-lider"
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span className="grid">
              <span className="text-sm font-semibold">Es líder del emprendimiento</span>
              <span id="ayuda-lider" className="text-[13px] text-muted-foreground">El líder puede agregar más integrantes a su equipo.</span>
            </span>
          </label>
        </fieldset>

        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando} icono={UserPlus}>
            {modo === 'existente' ? 'Asignar usuario' : 'Agregar integrante'}
          </Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default IntegranteModal;
