import { Link } from 'react-router-dom';
import { ExternalLink, Download, Trash2 } from 'lucide-react';
import { descargarArchivo } from '../../services/api';
import { CATEGORIAS_ARCHIVO, estadoDe } from '../../constants/estados';
import { formatFecha } from '../../utils/fechas';
import { iconoMaterial, formatoTamanio, dominioDe } from '../../utils/materiales';
import { CHIP_CLS, FONDO_TONO, iconoBotonCls } from '../ui/estilosSemanticos';

// Un material (enlace o archivo subido) en una lista: icono, nombre, descripción y datos; a la
// derecha, Abrir/Descargar y, si se pasa `onEliminar`, Eliminar. `conDestino` muestra para quién
// es (sus emprendimientos o «Toda la sesión»): lo usa el equipo técnico. `conSesion` enlaza su
// sesión, para listas que no están agrupadas por sesión.
const FilaMaterial = ({ archivo: a, conDestino = false, conSesion = false, onEliminar }) => {
  const { Icono, tono } = iconoMaterial(a);
  const categoria = estadoDe(CATEGORIAS_ARCHIVO, a.categoria);
  const esEnlace = a.tipo === 'enlace';
  // GET /archivos devuelve createdAt; el detalle de sesión y de emprendimiento, created_at
  const creado = a.created_at || a.createdAt;
  const origen = esEnlace ? dominioDe(a.url) : formatoTamanio(a.tamanio);
  const fecha = creado ? formatFecha(creado, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <li className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-b-0">
      <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-control ${FONDO_TONO[tono]}`}>
        <Icono size={16} aria-hidden="true" />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="break-words text-sm font-semibold">{a.nombre_original}</p>
        {a.descripcion && <p className="line-clamp-2 text-[13px] text-muted-foreground">{a.descripcion}</p>}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>{categoria.label}</span>
          {conDestino && (a.emprendimientos?.length
            ? a.emprendimientos.map((e) => <span key={e.id} className={`${CHIP_CLS} ${FONDO_TONO.info}`}>{e.nombre}</span>)
            : a.sesion_id || a.sesion ? <span className={`${CHIP_CLS} ${FONDO_TONO.success}`}>Toda la sesión</span> : null)}
          {conSesion && a.sesion && (
            <Link to={`/sesiones/${a.sesion.id}?tab=materiales`} className="font-medium text-link hover:underline">{a.sesion.titulo}</Link>
          )}
          {/* Un dominio largo puede partirse; «· fecha» va siempre junto */}
          {(origen || fecha) && (
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {origen}
              {origen && fecha && ' '}
              {fecha && <span className="whitespace-nowrap">{origen && '· '}{fecha}</span>}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {esEnlace ? (
          <a href={a.url} target="_blank" rel="noopener noreferrer" className={iconoBotonCls()} title="Abrir enlace">
            <ExternalLink size={16} aria-hidden="true" />
            <span className="sr-only">Abrir {a.nombre_original} (se abre en otra pestaña)</span>
          </a>
        ) : (
          <button type="button" onClick={() => descargarArchivo(a.id, a.nombre_original)} className={iconoBotonCls()} title="Descargar">
            <Download size={16} aria-hidden="true" />
            <span className="sr-only">Descargar {a.nombre_original}</span>
          </button>
        )}
        {onEliminar && (
          <button type="button" onClick={() => onEliminar(a)} className={iconoBotonCls('danger')} title="Eliminar">
            <Trash2 size={16} aria-hidden="true" />
            <span className="sr-only">Eliminar {a.nombre_original}</span>
          </button>
        )}
      </div>
    </li>
  );
};

export default FilaMaterial;
