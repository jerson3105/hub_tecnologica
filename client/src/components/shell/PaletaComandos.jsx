import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CornerDownLeft, Rocket, FolderKanban, CalendarDays, GraduationCap, User, Plus, Sun, Moon, Monitor } from 'lucide-react';
import api from '../../services/api';
import Modal from '../Modal';
import { enlacesDe } from './navegacion';
import { cambiarTema } from '../../tema';
import { formatFecha } from '../../utils/fechas';

const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const POR_GRUPO = 5;

// Datos para buscar: se piden al abrir la paleta y comparten caché con las páginas
const useFuente = (clave, url, campo, habilitado) => useQuery({
  queryKey: clave,
  queryFn: () => api.get(url).then((r) => r.data[campo] || []),
  enabled: habilitado,
  staleTime: 60 * 1000
});

// «Buscar o ir a…» (Ctrl/Cmd + K): páginas, acciones y, según el rol, emprendimientos, programas,
// sesiones, personas y mentores. Flechas para moverse, Enter para ir, Escape para cerrar.
const PaletaComandos = ({ abierta, onCerrar, nav, esAdmin }) => {
  const navigate = useNavigate();
  const idLista = useId();
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);

  const emprendimientos = useFuente(['emprendimientos', {}], '/emprendimientos', 'emprendimientos', abierta && esAdmin);
  const programas = useFuente(['programas', {}], '/programas', 'programas', abierta && esAdmin);
  const usuarios = useFuente(['usuarios', 'todos'], '/auth/usuarios', 'usuarios', abierta && esAdmin);
  const sesiones = useFuente(['sesiones', {}], '/sesiones', 'sesiones', abierta);
  const mentores = useFuente(['mentores', esAdmin ? {} : { activo: 'true' }], esAdmin ? '/mentores' : '/mentores?activo=true', 'mentores', abierta);

  const grupos = useMemo(() => {
    const q = normalizar(texto.trim());
    const coincide = (...campos) => !q || normalizar(campos.join(' ')).includes(q);
    const acciones = [
      ...(esAdmin ? [
        { id: 'a-sesion', titulo: 'Nueva sesión', icono: Plus, ir: '/sesiones?nueva=1' },
        { id: 'a-registro', titulo: 'Registrar seguimiento', icono: Plus, ir: '/seguimientos' }
      ] : []),
      { id: 'a-claro', titulo: 'Tema claro', icono: Sun, hacer: () => cambiarTema('claro') },
      { id: 'a-oscuro', titulo: 'Tema oscuro', icono: Moon, hacer: () => cambiarTema('oscuro') },
      { id: 'a-sistema', titulo: 'Tema del sistema', icono: Monitor, hacer: () => cambiarTema('sistema') }
    ];
    const lista = [
      { titulo: 'Ir a', items: enlacesDe(nav).filter((e) => coincide(e.label)).map((e) => ({ id: `p${e.to}`, titulo: e.label, icono: e.icono, ir: e.to })) },
      { titulo: 'Acciones', items: q ? acciones.filter((a) => coincide(a.titulo)) : acciones.slice(0, esAdmin ? 2 : 0) },
      { titulo: 'Emprendimientos', items: q ? (emprendimientos.data || []).filter((e) => coincide(e.nombre, e.sector)).map((e) => ({ id: `e${e.id}`, titulo: e.nombre, detalle: e.programa?.nombre, icono: Rocket, ir: `/emprendimientos/${e.id}` })) : [] },
      { titulo: 'Programas', items: q ? (programas.data || []).filter((p) => coincide(p.nombre)).map((p) => ({ id: `g${p.id}`, titulo: p.nombre, icono: FolderKanban, ir: `/programas/${p.id}` })) : [] },
      { titulo: 'Sesiones', items: q ? (sesiones.data || []).filter((s) => coincide(s.titulo)).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).map((s) => ({ id: `s${s.id}`, titulo: s.titulo, detalle: formatFecha(s.fecha, { day: 'numeric', month: 'short', year: 'numeric' }), icono: CalendarDays, ir: `/sesiones/${s.id}` })) : [] },
      { titulo: 'Personas', items: q ? (usuarios.data || []).filter((u) => coincide(u.nombre, u.apellido, u.email)).map((u) => ({ id: `u${u.id}`, titulo: `${u.nombre} ${u.apellido}`, detalle: u.email, icono: User, ir: `/usuarios?q=${encodeURIComponent(u.email)}` })) : [] },
      { titulo: 'Mentores', items: q ? (mentores.data || []).filter((m) => coincide(m.nombre, m.apellido)).map((m) => ({ id: `m${m.id}`, titulo: `${m.nombre} ${m.apellido}`, icono: GraduationCap, ir: `/mentores?q=${encodeURIComponent(m.nombre)}` })) : [] }
    ];
    // Cada resultado lleva su posición global para moverse con las flechas entre grupos
    let posicion = 0;
    return lista
      .map((g) => ({ ...g, items: g.items.slice(0, POR_GRUPO) }))
      .filter((g) => g.items.length)
      .map((g) => ({ ...g, items: g.items.map((item) => ({ ...item, pos: posicion++ })) }));
  }, [texto, nav, esAdmin, emprendimientos.data, programas.data, usuarios.data, sesiones.data, mentores.data]);

  const items = grupos.flatMap((g) => g.items);
  const indice = Math.min(activo, Math.max(items.length - 1, 0));
  const cargandoDatos = texto.trim() && [emprendimientos, programas, usuarios, sesiones, mentores].some((c) => c.isFetching && !c.data);

  const cerrar = () => { setTexto(''); setActivo(0); onCerrar(); };
  const elegir = (item) => {
    if (!item) return;
    cerrar();
    if (item.hacer) item.hacer();
    else navigate(item.ir);
  };
  const teclado = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((indice + 1) % Math.max(items.length, 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((indice - 1 + items.length) % Math.max(items.length, 1)); }
    if (e.key === 'Enter') { e.preventDefault(); elegir(items[indice]); }
  };

  return (
    <Modal isOpen={abierta} onClose={cerrar} title="Buscar o ir a" size="lg" closeOnBackdrop>
      <div className="grid gap-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-activedescendant={items[indice] ? `${idLista}-${items[indice].id}` : undefined}
            aria-autocomplete="list"
            aria-label="Buscar páginas, emprendimientos, sesiones o personas"
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setActivo(0); }}
            onKeyDown={teclado}
            placeholder={esAdmin ? 'Página, emprendimiento, sesión o persona…' : 'Página, sesión o mentor…'}
            className="h-12 w-full rounded-control border border-input bg-card pl-10 pr-3 text-base text-foreground placeholder:text-subtle-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <ul id={idLista} role="listbox" aria-label="Resultados" className="grid max-h-[min(26rem,55dvh)] gap-0.5 overflow-y-auto overscroll-contain">
          {grupos.map((g) => (
            <li key={g.titulo} role="presentation" className="grid gap-0.5">
              <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground" aria-hidden="true">{g.titulo}</p>
              <ul role="group" aria-label={g.titulo} className="grid gap-0.5">
                {g.items.map((item) => {
                  const Icono = item.icono;
                  const seleccionado = item.pos === indice;
                  return (
                    <li
                      key={item.id}
                      id={`${idLista}-${item.id}`}
                      role="option"
                      aria-selected={seleccionado}
                      onMouseMove={() => setActivo(item.pos)}
                      onClick={() => elegir(item)}
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2.5 ${seleccionado ? 'bg-info-soft' : ''}`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground"><Icono size={16} aria-hidden="true" /></span>
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-medium">{item.titulo}</span>
                        {item.detalle && <span className="truncate text-xs text-muted-foreground">{item.detalle}</span>}
                      </span>
                      {seleccionado && <CornerDownLeft size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          {!items.length && (
            <li role="presentation" className="px-3 py-8 text-center text-sm text-muted-foreground">
              {cargandoDatos ? 'Buscando…' : `Nada coincide con «${texto.trim()}».`}
            </li>
          )}
        </ul>
        <p className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex" aria-hidden="true">
          <span><kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> moverse</span>
          <span><kbd className="font-mono">Enter</kbd> ir</span>
          <span><kbd className="font-mono">Esc</kbd> cerrar</span>
        </p>
      </div>
    </Modal>
  );
};

export default PaletaComandos;
