import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import FilaMaterial from '../materiales/FilaMaterial';
import useEliminarMaterial from '../materiales/useEliminarMaterial';
import { TARJETA_CLS, TITULO_BLOQUE_CLS } from '../ui/estilosSemanticos';

// Materiales de la sesión. El equipo técnico puede añadir enlaces (presentaciones, Drive…) para
// toda la sesión o para un emprendimiento (p. ej. el informe de su diagnóstico).
const MaterialesSesion = ({ sesion, esAdmin, emprendimientos = [] }) => {
  const queryClient = useQueryClient();
  const eliminar = useEliminarMaterial();
  const [abierto, setAbierto] = useState(false);
  const [enlace, setEnlace] = useState({ nombre: '', url: '', para: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const archivos = sesion.archivos || [];

  const agregar = async (e) => {
    e.preventDefault();
    if (!enlace.nombre.trim() || !/^https?:\/\/\S+$/i.test(enlace.url.trim())) {
      setError('Escribe un nombre y un enlace que empiece por http:// o https://');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/archivos/enlace', {
        nombre: enlace.nombre.trim(),
        url: enlace.url.trim(),
        categoria: sesion.tipo === 'taller' ? 'taller' : 'otro',
        sesion_id: sesion.id,
        emprendimiento_ids: enlace.para ? [Number(enlace.para)] : []
      });
      toast.success('Enlace agregado');
      setEnlace({ nombre: '', url: '', para: '' });
      setError(null);
      setAbierto(false);
      ['sesion', 'archivos'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No se pudo agregar el enlace');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="t-materiales" className={TARJETA_CLS}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 id="t-materiales" className={TITULO_BLOQUE_CLS}>Materiales</h2>
        {esAdmin && !abierto && (
          <Button variante="secondary" tamanio="sm" icono={Plus} onClick={() => setAbierto(true)} aria-expanded={abierto} aria-controls="form-enlace">
            Agregar enlace
          </Button>
        )}
      </div>

      {abierto && (
        <form id="form-enlace" onSubmit={agregar} className="grid gap-3 border-t border-border bg-muted/40 px-5 py-4" noValidate>
          <div className={`grid gap-3 ${emprendimientos.length ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <Field label="Nombre" error={error && !enlace.nombre.trim() ? 'Escribe un nombre' : null}>
              <Input value={enlace.nombre} onChange={(e) => setEnlace({ ...enlace, nombre: e.target.value })} placeholder="Ej: Presentación del taller" />
            </Field>
            <Field label="Enlace" error={error && !/^https?:\/\/\S+$/i.test(enlace.url.trim()) ? 'Debe empezar por http:// o https://' : null}>
              <Input type="url" value={enlace.url} onChange={(e) => setEnlace({ ...enlace, url: e.target.value })} placeholder="https://" />
            </Field>
            {emprendimientos.length > 0 && (
              <Field label="Para">
                <Select value={enlace.para} onChange={(e) => setEnlace({ ...enlace, para: e.target.value })}>
                  <option value="">Toda la sesión</option>
                  {emprendimientos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variante="ghost" tamanio="sm" onClick={() => { setAbierto(false); setError(null); }}>Cancelar</Button>
            <Button type="submit" tamanio="sm" cargando={guardando}>Agregar</Button>
          </div>
        </form>
      )}

      {archivos.length === 0 ? (
        <p className="border-t border-border px-5 py-6 text-sm text-muted-foreground">Esta sesión aún no tiene materiales.</p>
      ) : (
        <ul className="border-t border-border">
          {archivos.map((a) => (
            <FilaMaterial key={a.id} archivo={a} conDestino={esAdmin} onEliminar={esAdmin ? eliminar : undefined} />
          ))}
        </ul>
      )}
    </section>
  );
};

export default MaterialesSesion;
