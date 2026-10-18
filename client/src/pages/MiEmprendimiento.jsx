import { Navigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEmprendimientos } from '../hooks/useQueryHooks';
import EspacioEmprendimiento, { EsqueletoEspacio } from '../components/emprendimientos/EspacioEmprendimiento';
import ErrorCarga from '../components/ui/ErrorCarga';
import { TARJETA_CLS } from '../components/ui/estilosSemanticos';

// Inicio del emprendedor: el espacio de su emprendimiento (cada emprendedor pertenece a uno)
const MiEmprendimiento = () => {
  const { esAdmin } = useAuth();
  const { data: emprendimientos, isLoading, isError, refetch } = useEmprendimientos({}, { enabled: !esAdmin });

  if (esAdmin) return <Navigate to="/dashboard" replace />;
  if (isLoading) return <EsqueletoEspacio />;
  if (isError && !emprendimientos) {
    return <div className={`${TARJETA_CLS} mx-auto max-w-page`}><ErrorCarga mensaje="No se pudo cargar tu emprendimiento." onReintentar={refetch} /></div>;
  }

  const emp = emprendimientos?.[0];
  if (!emp) {
    return (
      <div className={`${TARJETA_CLS} mx-auto grid max-w-page justify-items-center gap-3 px-5 py-14 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-programa-soft text-programa-soft-foreground"><Rocket size={24} aria-hidden="true" /></span>
        <h1 className="font-display text-xl font-semibold">Aún no tienes un emprendimiento asignado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          El equipo técnico te sumará al equipo de tu emprendimiento. Si ya deberías estar en uno, escríbeles.
        </p>
      </div>
    );
  }

  return <EspacioEmprendimiento id={String(emp.id)} />;
};

export default MiEmprendimiento;
