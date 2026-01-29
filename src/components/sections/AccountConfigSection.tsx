import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AccountService } from '../../services/accountService';

interface QuickNotificationSetting {
  code: string;
  enabled: boolean;
}

// Tipos de \"comunicaciones rápidas\" alineados con la app mobile (TutorQuickActionsScreen)
const QUICK_NOTIFICATION_TYPES: { code: string; label: string }[] = [
  { code: 'llega_tarde', label: 'Llega tarde' },
  { code: 'ausencia_dia', label: 'Ausencia del día' },
  { code: 'retiro_anticipado', label: 'Retiro anticipado' },
  { code: 'autorizacion_retiro_tercero', label: 'Autorización de retiro por tercero' },
  { code: 'solicita_reunion', label: 'Solicita reunión' },
  { code: 'pedido_informacion_dia', label: 'Pedido de información del día' },
  { code: 'consulta_conducta_adaptacion', label: 'Consulta sobre conducta o adaptación' },
  { code: 'trae_medicacion', label: 'Trae medicación' },
  { code: 'aviso_alergia_condicion', label: 'Aviso de alergia o condición temporal' },
  { code: 'cambio_ropa_necesario', label: 'Cambio de ropa necesario' },
  { code: 'olvido_pertenencias', label: 'Olvidó pertenencias' },
  { code: 'objeto_importante_mochila', label: 'Objeto importante en la mochila' },
  { code: 'autorizacion_especial', label: 'Autorización especial' },
  { code: 'consulta_alimentacion', label: 'Consulta sobre alimentación' },
];

export const AccountConfigSection: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    requiereAprobarActividades: boolean;
    quickNotificationSettings: QuickNotificationSetting[];
  } | null>(null);

  const accountId = user?.account?._id || '';
  const isAdminAccount = user?.role?.nombre === 'adminaccount';

  useEffect(() => {
    const loadConfig = async () => {
      if (!accountId || !isAdminAccount) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const cfg = await AccountService.getAccountConfig(accountId);

        const existingQuick =
          cfg.quickNotificationSettings && cfg.quickNotificationSettings.length > 0
            ? cfg.quickNotificationSettings
            : QUICK_NOTIFICATION_TYPES.map(t => ({ code: t.code, enabled: true }));

        setConfig({
          requiereAprobarActividades: cfg.requiereAprobarActividades,
          quickNotificationSettings: existingQuick,
        });
      } catch (err: any) {
        console.error('Error cargando configuración de cuenta:', err);
        setError(err.message || 'Error al cargar la configuración de la institución');
        // Valores por defecto
        setConfig({
          requiereAprobarActividades: true,
          quickNotificationSettings: QUICK_NOTIFICATION_TYPES.map(t => ({
            code: t.code,
            enabled: true,
          })),
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [accountId, isAdminAccount]);

  const handleSave = async () => {
    if (!accountId || !config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await AccountService.updateAccountConfig(accountId, {
        requiereAprobarActividades: config.requiereAprobarActividades,
        quickNotificationSettings: config.quickNotificationSettings,
      });

      setSuccessMessage('Configuración guardada correctamente.');
    } catch (err: any) {
      console.error('Error guardando configuración de cuenta:', err);
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdminAccount) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">
            Solo los usuarios con rol administrador de institución (adminaccount) pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">
            No se encontró una institución asociada a este usuario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración de la Institución</h2>
            <p className="text-sm text-gray-500">
              Define cómo se comportan las actividades y qué tipos de comunicaciones rápidas están habilitadas en la app.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {loading || !config ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Cargando configuración...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Actividades</h3>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requiereAprobarActividades}
                  onChange={(e) =>
                    setConfig(prev =>
                      prev
                        ? { ...prev, requiereAprobarActividades: e.target.checked }
                        : prev
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Requerir aprobación de actividades
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Si está activado, las actividades se crean en estado "borrador" y deben ser aprobadas antes de publicarse. Si está desactivado, las actividades se publican automáticamente.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Comunicaciones rápidas habilitadas</h3>
              <p className="text-xs text-gray-500 mb-3">
                Selecciona qué tipos de comunicaciones rápidas pueden usar los usuarios de esta institución en la app.
              </p>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUICK_NOTIFICATION_TYPES.map(type => {
                      const enabled =
                        config.quickNotificationSettings.find(s => s.code === type.code)?.enabled ?? true;

                      return (
                        <tr key={type.code} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{type.label}</span>
                              <span className="text-[11px] text-gray-500">{type.code}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) =>
                                  setConfig(prev => {
                                    if (!prev) return prev;
                                    const current = prev.quickNotificationSettings || [];
                                    const existingIndex = current.findIndex(s => s.code === type.code);
                                    const next = [...current];
                                    if (existingIndex >= 0) {
                                      next[existingIndex] = {
                                        ...next[existingIndex],
                                        enabled: e.target.checked,
                                      };
                                    } else {
                                      next.push({
                                        code: type.code,
                                        enabled: e.target.checked,
                                      });
                                    }
                                    return {
                                      ...prev,
                                      quickNotificationSettings: next,
                                    };
                                  })
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-xs text-gray-700">
                                {enabled ? 'Activo' : 'Inactivo'}
                              </span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  saving ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

