import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal, { ModalPie } from '../Modal';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { ETIQUETA_CLS } from '../ui/estilos';
import { useSesiones, useEmprendimientos } from '../../hooks/useQueryHooks';
import { CATEGORIAS_ARCHIVO } from '../../constants/estados';
import { formatFecha } from '../../utils/fechas';

const URL_VALIDA = /^https?:\/\/\S+$/i;
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const programaDe = (e) => e.programa_id ?? e.programa?.id;
const programasDeSesion = (s) => (s.programas?.length ? s.programas.map((p) => p.id) : [s.programa_id].filter(Boolean));

// Emprendimientos que pueden recibir el material: los de los programas de la sesión elegida
// (o todos los activos si no hay sesión), más los ya marcados para no perderlos de vista.
const candidatosPara = (sesion, emprendimientos, marcados) => {
  const programas = sesion ? programasDeSesion(sesion) : null;
  return emprendimientos
    .filter((e) => marcados.includes(e.id) || (e.estado === 'activo' && (!programas || programas.includes(programaDe(e)))))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};

// Compartir un enlace (Drive, presentación, grabación…) con una sesión, con emprendimientos
// concretos o con ambos. Sin sesión ni emprendimientos ningún emprendedor lo vería: se exige uno.
const EnlaceMaterialModal = ({ sesionInicial = null, emprendimientoInicial = null, onClose, onGuardado }) => {
  const queryClient = useQueryClient();
  const { data: sesiones = [] } = useSesiones();
  const { data: emprendimientos = [] } = useEmprendimientos();
  const [form, setForm] = useState({
    nombre: '',
    url: '',
    descripcion: '',
    categoria: null, // null = según la sesión (taller → Taller; si no, Otro)
    sesion_id: sesionInicial ? String(sesionInicial) : '',
    emprendimiento_ids: emprendimientoInicial ? [Number(emprendimientoInicial)] : []
  });
  const [filtro, setFiltro] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const ordenadas = [...sesiones].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const sesion = sesiones.find((s) => String(s.id) === form.sesion_id) || null;
  const categoria = form.categoria || (sesion?.tipo === 'taller' ? 'taller' : 'otro');
  const candidatos = candidatosPara(sesion, emprendimientos, form.emprendimiento_ids);
  const visibles = filtro ? candidatos.filter((e) => normalizar(e.nombre).includes(normalizar(filtro))) : candidatos;
  const marcados = form.emprendimiento_ids.length;

  const errorNombre = intentado && !form.nombre.trim() ? 'Escribe un nombre' : null;
  const errorUrl = intentado && !URL_VALIDA.test(form.url.trim()) ? 'Debe empezar por http:// o https://' : null;
  const errorDestino = intentado && !form.sesion_id && marcados === 0
    ? 'Elige una sesión o al menos un emprendimiento: si no, ningún emprendedor lo verá.'
    : null;
  const ayudaDestino = !form.sesion_id
    ? 'Sin sesión, solo lo verán los emprendimientos que marques.'
    : marcados === 0 ? 'Sin marcar ninguno, lo verá toda la sesión.' : 'Solo lo verán los emprendimientos marcados.';

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const cambiarSesion = (e) => {
    const valor = e.target.value;
    const nueva = sesiones.find((s) => String(s.id) === valor) || null;
    // Al cambiar de sesión se desmarcan los emprendimientos que no están en ella
    const permitidos = new Set(candidatosPara(nueva, emprendimientos, []).map((x) => x.id));
    setForm((f) => ({ ...f, sesion_id: valor, emprendimiento_ids: f.emprendimiento_ids.filter((id) => permitidos.has(id)) }));
  };
  const alternar = (id) => setForm((f) => ({
    ...f,
    emprendimiento_ids: f.emprendimiento_ids.includes(id) ? f.emprendimiento_ids.filter((x) => x !== id) : [...f.emprendimiento_ids, id]
  }));

  const guardar = async (e) => {
    e.preventDefault();
    setIntentado(true);
    if (!form.nombre.trim() || !URL_VALIDA.test(form.url.trim()) || (!form.sesion_id && marcados === 0)) return;
    setGuardando(true);
    try {
      await api.post('/archivos/enlace', {
        nombre: form.nombre.trim(),
        url: form.url.trim(),
        descripcion: form.descripcion.trim(),
        categoria,
        sesion_id: form.sesion_id || null,
        emprendimiento_ids: form.emprendimiento_ids
      });
      toast.success('Enlace agregado');
      ['archivos', 'sesion', 'emprendimiento'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      onGuardado?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo agregar el enlace');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title="Agregar enlace"
      descripcion="Una presentación, carpeta de Drive, grabación o plantilla. Los emprendedores lo verán en Materiales y en la sesión.">
      <form onSubmit={guardar} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" requerido error={errorNombre}>
            <Input value={form.nombre} onChange={cambiar('nombre')} placeholder="Ej: Presentación del taller de costos" maxLength={255} />
          </Field>
          <Field label="Enlace" requerido error={errorUrl}>
            <Input type="url" inputMode="url" value={form.url} onChange={cambiar('url')} placeholder="https://" />
          </Field>
        </div>
        <Field label="Descripción" ayuda="Para qué sirve o qué contiene (opcional).">
          <Textarea value={form.descripcion} onChange={cambiar('descripcion')} rows={2} className="min-h-20 resize-y" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
          <Field label="Sesión">
            <Select value={form.sesion_id} onChange={cambiarSesion}>
              <option value="">Sin sesión (material del emprendimiento)</option>
              {ordenadas.map((s) => (
                <option key={s.id} value={s.id}>{s.titulo} · {formatFecha(s.fecha, { day: 'numeric', month: 'short', year: 'numeric' })}</option>
              ))}
            </Select>
          </Field>
          <Field label="Categoría">
            <Select value={categoria} onChange={cambiar('categoria')}>
              {Object.entries(CATEGORIAS_ARCHIVO).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
            </Select>
          </Field>
        </div>

        <fieldset aria-describedby={`ayuda-destino${errorDestino ? ' error-destino' : ''}`}>
          <legend className={ETIQUETA_CLS}>Para</legend>
          <p id="ayuda-destino" className="-mt-1 mb-2 text-xs text-muted-foreground">{ayudaDestino}</p>
          {candidatos.length > 6 && (
            <div className="relative mb-2">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar emprendimiento" aria-label="Buscar emprendimiento" className="pl-9" />
            </div>
          )}
          {candidatos.length === 0 ? (
            <p className="rounded-control border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              {sesion ? 'Esta sesión no tiene emprendimientos activos.' : 'No hay emprendimientos activos.'}
            </p>
          ) : (
            <ul className="grid max-h-56 gap-0.5 overflow-y-auto overscroll-contain rounded-control border border-input p-1">
              {visibles.map((emp) => {
                const activo = form.emprendimiento_ids.includes(emp.id);
                return (
                  <li key={emp.id}>
                    <label className={`flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-[calc(var(--radius-control)-4px)] px-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${activo ? 'bg-info-soft font-medium' : 'hover:bg-muted'}`}>
                      <input type="checkbox" checked={activo} onChange={() => alternar(emp.id)} className="sr-only" />
                      <span className={`grid size-4 shrink-0 place-items-center rounded-[4px] border ${activo ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`} aria-hidden="true">
                        {activo && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{emp.nombre}</span>
                      {!sesion && emp.programa?.nombre && <span className="shrink-0 text-xs text-muted-foreground">{emp.programa.nombre}</span>}
                    </label>
                  </li>
                );
              })}
              {visibles.length === 0 && <li className="px-2.5 py-3 text-sm text-muted-foreground">Ninguno coincide.</li>}
            </ul>
          )}
          {marcados > 0 && <p className="mt-1.5 text-xs font-semibold text-link" aria-live="polite">{marcados === 1 ? '1 emprendimiento marcado' : `${marcados} emprendimientos marcados`}</p>}
          {errorDestino && <p id="error-destino" role="alert" className="mt-1.5 text-xs text-danger">{errorDestino}</p>}
        </fieldset>

        <ModalPie>
          <Button variante="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>Agregar enlace</Button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export default EnlaceMaterialModal;
