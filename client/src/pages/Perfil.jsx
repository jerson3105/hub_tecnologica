import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Field, Input } from '../components/ui/Field';
import { ROLES_USUARIO, estadoDe } from '../constants/estados';

const Perfil = () => {
  const { usuario } = useAuth();
  const [formPassword, setFormPassword] = useState({ passwordActual: '', passwordNuevo: '', confirmar: '' });
  const [guardando, setGuardando] = useState(false);
  // Antes: 'Administrador' si es admin y 'Emprendedor' en cualquier otro caso
  const rol = estadoDe(ROLES_USUARIO, usuario?.rol === 'admin' ? 'admin' : 'emprendedor');

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (formPassword.passwordNuevo !== formPassword.confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (formPassword.passwordNuevo.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setGuardando(true);
    try {
      await api.put('/auth/cambiar-password', {
        passwordActual: formPassword.passwordActual,
        passwordNuevo: formPassword.passwordNuevo
      });
      toast.success('Contraseña actualizada');
      setFormPassword({ passwordActual: '', passwordNuevo: '', confirmar: '' });
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al cambiar contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Mi Perfil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-brand-cyan/15 rounded-full flex items-center justify-center shrink-0" aria-hidden="true">
            <User size={32} className="text-brand-cyan-ink" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-brand-dark break-words">{usuario?.nombre} {usuario?.apellido}</h2>
            <p className="text-gray-500 break-words">{usuario?.email}</p>
            <Badge tono={rol.tono} className="mt-1">{rol.label}</Badge>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm break-words">
          <div>
            <dt className="text-gray-500">Nombre</dt>
            <dd className="font-medium text-brand-dark">{usuario?.nombre}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Apellido</dt>
            <dd className="font-medium text-brand-dark">{usuario?.apellido}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-brand-dark">{usuario?.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Teléfono</dt>
            <dd className="font-medium text-brand-dark">{usuario?.telefono || '-'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Lock size={20} className="text-gray-500" aria-hidden="true" /> Cambiar Contraseña
        </h3>
        <form onSubmit={cambiarPassword} className="space-y-4">
          <Field label="Contraseña Actual" requerido>
            <Input id="perfil-pass-actual" type="password" autoComplete="current-password" value={formPassword.passwordActual} onChange={(e) => setFormPassword({ ...formPassword, passwordActual: e.target.value })} />
          </Field>
          <Field label="Nueva Contraseña" requerido ayuda="Mínimo 6 caracteres.">
            <Input id="perfil-pass-nueva" type="password" autoComplete="new-password" minLength={6} value={formPassword.passwordNuevo} onChange={(e) => setFormPassword({ ...formPassword, passwordNuevo: e.target.value })} />
          </Field>
          <Field label="Confirmar Nueva Contraseña" requerido>
            <Input id="perfil-pass-confirmar" type="password" autoComplete="new-password" value={formPassword.confirmar} onChange={(e) => setFormPassword({ ...formPassword, confirmar: e.target.value })} />
          </Field>
          <Button type="submit" icono={Save} cargando={guardando}>
            {guardando ? 'Guardando...' : 'Cambiar Contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Perfil;
