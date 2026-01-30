import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CreditCard, ListChecks, PlusCircle, BarChart3, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AccountService, PaymentRow, PaymentStats, OrigenPago } from '../../services/accountService';
import { grupoService, Grupo } from '../../services/grupoService';

const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
];

interface PaymentConfigSectionProps {
  view?: 'config' | 'register' | 'stats';
  onSectionChange?: (section: string) => void;
}

export const PaymentConfigSection: React.FC<PaymentConfigSectionProps> = ({ view, onSectionChange }) => {
  const { user } = useAuth();
  const tabFromView = view === 'config' ? 'config' : view === 'register' ? 'payments' : view === 'stats' ? 'dashboard' : null;
  const [activeTab, setActiveTab] = useState<'config' | 'payments' | 'dashboard'>(tabFromView ?? 'config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [divisiones, setDivisiones] = useState<Grupo[]>([]);
  const [config, setConfig] = useState<{
    matriculaAnual: { cobran: boolean; monto: number };
    matriculaPorDivision: { division: string; monto: number }[];
    cuotaPorDivision: { division: string; monto: number }[];
    moneda: string;
  } | null>(null);

  const [paymentsData, setPaymentsData] = useState<{ payments: PaymentRow[]; moneda: string } | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentsSuccess, setPaymentsSuccess] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterDivisionId, setFilterDivisionId] = useState<string>('');
  const [modalRow, setModalRow] = useState<PaymentRow | null>(null);
  const [modalAmountPaid, setModalAmountPaid] = useState('');
  const [modalPaidAt, setModalPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [modalNotes, setModalNotes] = useState('');
  const [modalOrigen, setModalOrigen] = useState<string>('');
  const [modalReferencia, setModalReferencia] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const ORIGENES: { value: OrigenPago | ''; label: string }[] = [
    { value: '', label: '—' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'banco', label: 'Banco' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'otro', label: 'Otro' }
  ];

  const [statsData, setStatsData] = useState<PaymentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());

  const accountId = user?.account?._id || '';
  const isAdminAccount = user?.role?.nombre === 'adminaccount';
  const isSuperAdmin = user?.role?.nombre === 'superadmin';

  useEffect(() => {
    if (tabFromView != null) setActiveTab(tabFromView);
  }, [view, tabFromView]);

  useEffect(() => {
    const load = async () => {
      if (!accountId || (!isAdminAccount && !isSuperAdmin)) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [gruposRes, paymentConfig] = await Promise.all([
          grupoService.getGrupos(1, 500, '', accountId),
          AccountService.getPaymentConfig(accountId),
        ]);
        setDivisiones(gruposRes.grupos || []);
        setConfig({
          matriculaAnual: paymentConfig.matriculaAnual || { cobran: false, monto: 0 },
          matriculaPorDivision: paymentConfig.matriculaPorDivision || [],
          cuotaPorDivision: paymentConfig.cuotaPorDivision || [],
          moneda: paymentConfig.moneda || 'ARS',
        });
      } catch (err: any) {
        console.error('Error cargando configuración de cobranzas:', err);
        setError(err.message || 'Error al cargar la configuración de cobranzas');
        setConfig({
          matriculaAnual: { cobran: false, monto: 0 },
          matriculaPorDivision: [],
          cuotaPorDivision: [],
          moneda: 'ARS',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountId, isAdminAccount, isSuperAdmin]);

  useEffect(() => {
    if (activeTab !== 'payments' || !accountId) return;
    const load = async () => {
      setPaymentsLoading(true);
      setPaymentsError(null);
      try {
        const data = await AccountService.getPayments(accountId, {
          year: filterYear,
          month: filterMonth,
          divisionId: filterDivisionId || undefined
        });
        setPaymentsData(data);
      } catch (err: any) {
        setPaymentsError(err.message || 'Error al cargar pagos');
        setPaymentsData(null);
      } finally {
        setPaymentsLoading(false);
      }
    };
    load();
  }, [activeTab, accountId, filterYear, filterMonth, filterDivisionId]);

  useEffect(() => {
    if (activeTab !== 'dashboard' || !accountId) return;
    const load = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const data = await AccountService.getPaymentStats(accountId, statsYear);
        setStatsData(data);
      } catch (err: any) {
        setStatsError(err.message || 'Error al cargar estadísticas');
        setStatsData(null);
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, [activeTab, accountId, statsYear]);

  const getMontoForDivision = (divisionId: string): number => {
    if (!config) return 0;
    const item = config.cuotaPorDivision.find((c) => c.division === divisionId);
    return item ? item.monto : 0;
  };

  const setMontoForDivision = (divisionId: string, monto: number) => {
    if (!config) return;
    const rest = config.cuotaPorDivision.filter((c) => c.division !== divisionId);
    const newList = monto >= 0 ? [...rest, { division: divisionId, monto }] : rest;
    setConfig((prev) => prev ? { ...prev, cuotaPorDivision: newList } : null);
  };

  const getMatriculaForDivision = (divisionId: string): number => {
    if (!config) return 0;
    const item = config.matriculaPorDivision.find((c) => c.division === divisionId);
    return item ? item.monto : 0;
  };

  const setMatriculaForDivision = (divisionId: string, monto: number) => {
    if (!config) return;
    const rest = config.matriculaPorDivision.filter((c) => c.division !== divisionId);
    const newList = monto >= 0 ? [...rest, { division: divisionId, monto }] : rest;
    setConfig((prev) => prev ? { ...prev, matriculaPorDivision: newList } : null);
  };

  const handleSave = async () => {
    if (!accountId || !config) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      await AccountService.updatePaymentConfig(accountId, {
        matriculaAnual: config.matriculaAnual,
        matriculaPorDivision: config.matriculaPorDivision,
        cuotaPorDivision: config.cuotaPorDivision,
        moneda: config.moneda,
      });
      setSuccessMessage('Configuración de cobranzas guardada correctamente.');
    } catch (err: any) {
      console.error('Error guardando configuración de cobranzas:', err);
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (row: PaymentRow) => {
    setModalRow(row);
    setModalAmountPaid(String(row.amountPaid || ''));
    setModalPaidAt(row.paidAt ? row.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setModalNotes(row.notes || '');
    setModalOrigen(row.origen || '');
    setModalReferencia(row.referencia || '');
  };

  const closePaymentModal = () => {
    setModalRow(null);
  };

  const handleSubmitPayment = async () => {
    if (!accountId || !modalRow || !modalRow.division) return;
    const amountPaid = parseFloat(modalAmountPaid) || 0;
    try {
      setModalSaving(true);
      setPaymentsError(null);
      setPaymentsSuccess(null);
      await AccountService.upsertPayment(accountId, {
        studentId: modalRow.student._id,
        divisionId: modalRow.division._id,
        year: modalRow.year,
        month: modalRow.month as number,
        amountPaid,
        paidAt: amountPaid > 0 ? modalPaidAt : undefined,
        notes: modalNotes.trim() || undefined,
        origen: modalOrigen.trim() || undefined,
        referencia: modalReferencia.trim() || undefined
      });
      setPaymentsSuccess('Pago registrado correctamente.');
      closePaymentModal();
      const data = await AccountService.getPayments(accountId, {
        year: filterYear,
        month: filterMonth,
        divisionId: filterDivisionId || undefined
      });
      setPaymentsData(data);
    } catch (err: any) {
      setPaymentsError(err.message || 'Error al registrar pago');
    } finally {
      setModalSaving(false);
    }
  };

  if (!isAdminAccount && !isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">
            Solo administradores de institución o superadmin pueden acceder a esta sección.
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
          <p className="text-sm text-red-700">No se encontró la institución asociada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cobranzas</h2>
            <p className="text-sm text-gray-500">
              Configurar precios por división y registrar pagos por mes y estudiante.
            </p>
          </div>
        </div>
      </div>

      {!view && (
        <div className="bg-white rounded-xl p-2 shadow-sm">
          <div className="flex gap-1 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'config' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Configuración
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'payments' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Registro de pagos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </button>
          </div>
        </div>
      )}

      {view && onSectionChange && (
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2 border-b border-gray-200">
          <span className="text-sm text-gray-500">Cobranzas:</span>
          <button
            type="button"
            onClick={() => onSectionChange('payment-config')}
            className={`text-sm font-medium px-3 py-1.5 rounded ${view === 'config' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Configuración
          </button>
          <button
            type="button"
            onClick={() => onSectionChange('payment-register')}
            className={`text-sm font-medium px-3 py-1.5 rounded ${view === 'register' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Registro
          </button>
          <button
            type="button"
            onClick={() => onSectionChange('payment-stats')}
            className={`text-sm font-medium px-3 py-1.5 rounded ${view === 'stats' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Estadísticas
          </button>
        </div>
      )}

      {activeTab === 'config' && (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {loading || !config ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Cargando...</span>
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

            {/* Matrícula anual */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Matrícula anual</h3>
              <label className="flex items-center space-x-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={config.matriculaAnual.cobran}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            matriculaAnual: { ...prev.matriculaAnual, cobran: e.target.checked },
                          }
                        : null
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Cobran matrícula anual</span>
              </label>
              {config.matriculaAnual.cobran && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">{config.moneda}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={config.matriculaAnual.monto}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              matriculaAnual: {
                                ...prev.matriculaAnual,
                                monto: parseFloat(e.target.value) || 0,
                              },
                            }
                          : null
                      )}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-32 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Matrícula por división */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Matrícula anual por división</h3>
              <p className="text-xs text-gray-500 mb-3">
                Monto de matrícula (una vez al año) por cada división (en {config.moneda}). Se puede registrar y cobrar en Registro de pagos eligiendo mes &quot;Matrícula&quot;.
              </p>
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">División</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Matrícula anual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divisiones.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-gray-500 text-center">
                          No hay divisiones cargadas.
                        </td>
                      </tr>
                    ) : (
                      divisiones.map((div) => (
                        <tr key={div._id} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{div.nombre}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={getMatriculaForDivision(div._id)}
                              onChange={(e) =>
                                setMatriculaForDivision(div._id, parseFloat(e.target.value) || 0)
                              }
                              className="border border-gray-300 rounded px-2 py-1.5 w-28 text-sm"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cuota por división */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Cuota mensual por división</h3>
              <p className="text-xs text-gray-500 mb-3">
                Monto de la cuota mensual por cada división (en {config.moneda}).
              </p>
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">División</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Cuota mensual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divisiones.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-gray-500 text-center">
                          No hay divisiones cargadas para esta institución.
                        </td>
                      </tr>
                    ) : (
                      divisiones.map((div) => (
                        <tr key={div._id} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{div.nombre}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={getMontoForDivision(div._id)}
                              onChange={(e) =>
                                setMontoForDivision(div._id, parseFloat(e.target.value) || 0)
                              }
                              className="border border-gray-300 rounded px-2 py-1.5 w-28 text-sm"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {paymentsError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{paymentsError}</span>
            </div>
          )}
          {paymentsSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              {paymentsSuccess}
            </div>
          )}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Matrícula (anual)</option>
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">División</label>
              <select
                value={filterDivisionId}
                onChange={(e) => setFilterDivisionId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[180px]"
              >
                <option value="">Todas</option>
                {divisiones.map((d) => (
                  <option key={d._id} value={d._id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Cargando pagos...</span>
            </div>
          ) : paymentsData ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[60vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Estudiante</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">División</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">{filterMonth === 0 ? 'Matrícula esperada' : 'Cuota esperada'}</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Monto pagado</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Estado</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Fecha pago</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Origen</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Referencia</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-gray-500 text-center">
                        No hay estudiantes para el período y filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paymentsData.payments.map((row) => (
                      <tr key={`${row.student._id}-${row.division?._id}-${row.year}-${row.month}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {row.student.apellido}, {row.student.nombre}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{row.division?.nombre || '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {paymentsData.moneda} {row.amountExpected.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {paymentsData.moneda} {row.amountPaid.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            row.status === 'pagado' ? 'bg-green-100 text-green-800' :
                            row.status === 'parcial' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.origen ? ORIGENES.find((o) => o.value === row.origen)?.label || row.origen : '-'}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate" title={row.referencia || undefined}>{row.referencia || '-'}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => row.division && openPaymentModal(row)}
                            disabled={!row.division}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            <PlusCircle className="w-4 h-4" />
                            {row.paymentId ? 'Editar' : 'Registrar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {statsError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{statsError}</span>
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-600">Año:</label>
            <select
              value={statsYear}
              onChange={(e) => setStatsYear(parseInt(e.target.value, 10))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Cargando estadísticas...</span>
            </div>
          ) : statsData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Total cobrado ({statsData.year})</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">
                    {statsData.moneda} {statsData.totalCobrado.toLocaleString()}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Pendiente en el año</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-800">
                    {statsData.moneda} {statsData.totalPendiente.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm font-medium">Esperado ({statsData.year})</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {statsData.moneda} {statsData.totalEsperado.toLocaleString()}
                  </p>
                  {(statsData.matriculaEsperada ?? 0) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">incl. matrícula {statsData.moneda} {(statsData.matriculaEsperada ?? 0).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  <strong className="text-green-700">{statsData.resumenEstado.pagado}</strong> pagados
                </span>
                <span className="text-sm text-gray-600">
                  <strong className="text-amber-700">{statsData.resumenEstado.parcial}</strong> parciales
                </span>
                <span className="text-sm text-gray-600">
                  <strong className="text-gray-700">{statsData.resumenEstado.pendiente}</strong> pendientes
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Por mes ({statsData.year})</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Mes</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Esperado</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Cobrado</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Pendiente</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Pagados</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600">Pendientes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.porMes.map((row) => (
                        <tr key={row.month} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{MESES.find((m) => m.value === row.month)?.label || row.month}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{statsData.moneda} {row.esperado.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-green-700">{statsData.moneda} {row.cobrado.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-amber-700">{statsData.moneda} {row.pendiente.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center text-gray-700">{row.cantidadPagados}</td>
                          <td className="px-3 py-2 text-center text-gray-700">{row.cantidadPendientes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {modalRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrar pago</h3>
            <p className="text-sm text-gray-600 mb-4">
              {modalRow.student.apellido}, {modalRow.student.nombre} – {modalRow.division?.nombre} – {filterMonth === 0 ? `Matrícula ${filterYear}` : `${filterMonth}/${filterYear}`}
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Monto pagado</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={modalAmountPaid}
                  onChange={(e) => setModalAmountPaid(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de pago</label>
                <input
                  type="date"
                  value={modalPaidAt}
                  onChange={(e) => setModalPaidAt(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Origen</label>
                <select
                  value={modalOrigen}
                  onChange={(e) => setModalOrigen(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                >
                  {ORIGENES.map((o) => (
                    <option key={o.value || 'vacio'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Referencia (conciliación)</label>
                <input
                  type="text"
                  value={modalReferencia}
                  onChange={(e) => setModalReferencia(e.target.value)}
                  placeholder="Ej: número de operación, comprobante"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                  maxLength={150}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Opcional"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={closePaymentModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={modalSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {modalSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
