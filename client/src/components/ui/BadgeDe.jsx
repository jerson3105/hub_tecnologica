import Badge from './Badge';
import { estadoDe } from '../../constants/estados';

// Badge a partir de un mapa de constants/ ({ clave: { label, tono, icono? } }): estados,
// roles, tipos de objetivo o de sesión... Una clave desconocida se muestra tal cual en gris.
const BadgeDe = ({ mapa, valor, ...props }) => {
  const item = estadoDe(mapa, valor, { label: valor ? String(valor).replace(/_/g, ' ') : '-', tono: 'neutral' });
  return <Badge tono={item.tono} icono={item.icono} {...props}>{item.label}</Badge>;
};

export default BadgeDe;
