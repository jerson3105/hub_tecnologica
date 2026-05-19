import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Perfil = () => {
  const { usuario } = useAuth();
  const [formPassword, setFormPassword] = useState({ passwordActual: '', passwordNuevo: '', confirmar: '' });
  const [guardando, setGuardando] = useState(false);

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
      <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{usuario?.nombre} {usuario?.apellido}</h2>
            <p className="text-gray-500">{usuario?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
              {usuario?.rol === 'admin' ? 'Administrador' : 'Emprendedor'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nombre</p>
            <p className="font-medium text-gray-900">{usuario?.nombre}</p>
          </div>
          <div>
            <p className="text-gray-500">Apellido</p>
            <p className="font-medium text-gray-900">{usuario?.apellido}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{usuario?.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Teléfono</p>
            <p className="font-medium text-gray-900">{usuario?.telefono || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={20} className="text-gray-500" /> Cambiar Contraseña
        </h3>
        <form onSubmit={cambiarPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <input type="password" value={formPassword.passwordActual} onChange={(e) => setFormPassword({...formPassword, passwordActual: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input type="password" value={formPassword.passwordNuevo} onChange={(e) => setFormPassword({...formPassword, passwordNuevo: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
            <input type="password" value={formPassword.confirmar} onChange={(e) => setFormPassword({...formPassword, confirmar: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <button type="submit" disabled={guardando} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50">
            {guardando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={16} />}
            {guardando ? 'Guardando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Perfil;
