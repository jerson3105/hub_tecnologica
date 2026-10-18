import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EspacioEmprendimiento from '../components/emprendimientos/EspacioEmprendimiento';

// Detalle de un emprendimiento para el equipo técnico. El emprendedor tiene el mismo espacio en
// «Mi emprendimiento» (con sus permisos): los enlaces antiguos a /emprendimientos/:id lo llevan allí.
const EmprendimientoDetalle = () => {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const { search } = useLocation();
  if (!esAdmin) return <Navigate to={`/mi-emprendimiento${search}`} replace />;
  return <EspacioEmprendimiento id={id} />;
};

export default EmprendimientoDetalle;
