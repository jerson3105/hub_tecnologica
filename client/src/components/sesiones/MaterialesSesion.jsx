import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link2, File, FileText, Image, Film, ExternalLink, Download, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { descargarArchivo } from '../../services/api';
import Button from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { CATEGORIAS_ARCHIVO, estadoDe } from '../../constants/estados';
import { formatFecha } from '../../utils/fechas';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, iconoBotonCls } from '../ui/estilosSemanticos';

const iconoDe = (a) => {
  if (a.tipo === 'enlace') return Link2;
  if (a.tipo_mime?.startsWith('image/')) return Image;
  if (a.tipo_mime?.startsWith('video/')) return Film;
  if (a.tipo_mime?.includes('pdf')) return FileText;
  return File;
};

// Materiales de la sesión. El equipo técnico puede añadir enlaces (presentaciones, Drive…).
const MaterialesSesion = ({ sesion, esAdmin }) => {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [enlace, setEnlace] = useState({ nombre: '', url: '' });
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
        emprendimiento_ids: []
      });
      toast.success('Enlace agregado');
      setEnlace({ nombre: '', url: '' });
      setError(null);
      setAbierto(false);
      queryClient.invalidateQueries({ queryKey: ['sesion'] });
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" error={error && !enlace.nombre.trim() ? 'Escribe un nombre' : null}>
              <Input value={enlace.nombre} onChange={(e) => setEnlace({ ...enlace, nombre: e.target.value })} placeholder="Ej: Presentación del taller" />
            </Field>
            <Field label="Enlace" error={error && !/^https?:\/\/\S+$/i.test(enlace.url.trim()) ? 'Debe empezar por http:// o https://' : null}>
              <Input type="url" value={enlace.url} onChange={(e) => setEnlace({ ...enlace, url: e.target.value })} placeholder="https://" />
            </Field>
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
          {archivos.map((a) => {
            const Icono = iconoDe(a);
            const categoria = estadoDe(CATEGORIAS_ARCHIVO, a.categoria);
            return (
              <li key={a.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground"><Icono size={16} aria-hidden="true" /></span>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <p className="truncate text-sm font-semibold">{a.nombre_original}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>{categoria.label}</span>
                    {esAdmin && a.emprendimientos?.map((e) => <span key={e.id} className={`${CHIP_CLS} ${FONDO_TONO.info}`}>{e.nombre}</span>)}
                    {a.created_at && <span>{formatFecha(a.created_at)}</span>}
                  </p>
                </div>
                {a.tipo === 'enlace' ? (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className={iconoBotonCls()} aria-label={`Abrir ${a.nombre_original} (se abre en otra pestaña)`} title="Abrir enlace">
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <button type="button" onClick={() => descargarArchivo(a.id, a.nombre_original)} className={iconoBotonCls()} aria-label={`Descargar ${a.nombre_original}`} title="Descargar">
                    <Download size={16} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default MaterialesSesion;
