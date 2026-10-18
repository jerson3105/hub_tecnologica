import { useQuery } from '@tanstack/react-query';
import { Download, Globe, Mail, FileText } from 'lucide-react';
import api from '../../services/api';
import { useDescargarInforme } from '../../reportes/descargarInforme';
import Button from '../ui/Button';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';

const SECCIONES = [
  ['problematica', 'Problemática / oportunidad'],
  ['solucion', 'Solución / propuesta de valor'],
  ['modelo_negocio', 'Modelo de negocio'],
  ['mercado_objetivo', 'Mercado objetivo'],
  ['ventaja_competitiva', 'Ventaja competitiva'],
  ['hitos', 'Hitos / logros'],
  ['estado_actual', 'Estado actual / tracción'],
  ['necesidades', 'Necesidades']
];

const REDES = [
  ['pagina_web', 'Web'], ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'], ['twitter', 'X / Twitter']
];

const ENLACE_CLS = 'inline-flex min-h-9 items-center gap-1.5 rounded-control border border-border px-3 text-[13px] font-medium text-link transition-colors hover:bg-muted';

// One Pager del emprendimiento en lectura, con lo que falta por completar y la descarga en PDF de
// marca. `accion`: botón extra (p. ej. «Editar One Pager» para el propio equipo).
const OnePagerVista = ({ emprendimiento, accion = null }) => {
  const { descargar, generando } = useDescargarInforme();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['onePager', String(emprendimiento.id)],
    queryFn: () => api.get(`/one-pager/${emprendimiento.id}`).then((r) => r.data)
  });
  const onePager = data?.onePager || null;
  const completo = data?.completo || false;

  if (isLoading) {
    return (
      <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando One Pager">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }
  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar el One Pager." onReintentar={refetch} /></div>;
  if (!onePager) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-10 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><FileText size={24} aria-hidden="true" /></span>
        <p className="font-semibold">{accion ? 'Aún no han empezado su One Pager' : 'El equipo aún no ha empezado su One Pager'}</p>
        <p className="text-sm text-muted-foreground">{accion ? 'Cuenta en una página qué problema resuelven y cómo: lo usan los mentores y el match con IA.' : 'Lo completan los integrantes desde su cuenta.'}</p>
        {accion}
      </div>
    );
  }

  const faltan = SECCIONES.filter(([clave]) => !onePager[clave]?.trim?.());
  const redes = REDES.filter(([clave]) => onePager[clave]);

  return (
    <section aria-labelledby="t-onepager" className={`${TARJETA_CLS} grid gap-5 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="t-onepager" className={TITULO_BLOQUE_CLS}>One Pager</h2>
          <span className={`${CHIP_CLS} ${FONDO_TONO[completo ? 'success' : 'warning']}`}>{completo ? 'Completo' : 'Incompleto'}</span>
          {onePager.estado_proyecto && <span className={`${CHIP_CLS} ${FONDO_TONO.info}`}>{onePager.estado_proyecto}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {completo && (
            <Button variante="secondary" icono={Download} cargando={generando('onepager', emprendimiento.id)} onClick={() => descargar('onepager', emprendimiento.id)}>Descargar PDF</Button>
          )}
          {accion}
        </div>
      </div>

      {onePager.descripcion && <p className="max-w-3xl text-[15px] leading-relaxed">{onePager.descripcion}</p>}

      {!completo && faltan.length > 0 && (
        <p className="rounded-control bg-warning-soft px-3 py-2 text-[13px] text-warning-soft-foreground">
          Falta completar: {faltan.map(([, etiqueta]) => etiqueta.toLowerCase()).join(', ')}.
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        {SECCIONES.filter(([clave]) => onePager[clave]).map(([clave, etiqueta]) => (
          <div key={clave} className="rounded-control border border-border p-4">
            <dt className="eyebrow">{etiqueta}</dt>
            <dd className="mt-1 whitespace-pre-line text-sm">{onePager[clave]}</dd>
          </div>
        ))}
      </dl>

      {(onePager.correo_proyecto || redes.length > 0) && (
        <div className="grid gap-2">
          <h3 className="eyebrow">Contacto y redes</h3>
          <div className="flex flex-wrap gap-2">
            {onePager.correo_proyecto && (
              <a href={`mailto:${onePager.correo_proyecto}`} className={ENLACE_CLS}><Mail size={13} aria-hidden="true" />{onePager.correo_proyecto}</a>
            )}
            {redes.map(([clave, etiqueta]) => (
              <a key={clave} href={onePager[clave]} target="_blank" rel="noopener noreferrer" className={ENLACE_CLS}>
                {clave === 'pagina_web' && <Globe size={13} aria-hidden="true" />}{etiqueta}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default OnePagerVista;
