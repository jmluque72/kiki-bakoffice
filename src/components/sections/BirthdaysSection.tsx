import React, { useState, useEffect } from 'react';
import { Cake, Plus, Trash2, Upload, Download, Pencil } from 'lucide-react';
import { apiClient } from '../../config/api';
import { Notification } from '../Notification';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { useAuth } from '../../hooks/useAuth';
import { AccountService } from '../../services/accountService';
import { grupoService } from '../../services/grupoService';
import * as XLSX from 'xlsx';

interface Division {
  _id: string;
  nombre: string;
}

interface AccountOpt {
  _id: string;
  nombre: string;
}

interface StudentOpt {
  _id: string;
  nombre: string;
  apellido: string;
}

interface BirthdayRow {
  _id: string;
  tipo: 'ALUMNO' | 'PADRE';
  fechaNacimiento: string;
  student?: { _id: string; nombre: string; apellido: string; dni?: string } | null;
}

interface BirthdaysSectionProps {
  isReadonly?: boolean;
}

export const BirthdaysSection: React.FC<BirthdaysSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.nombre === 'superadmin';

  const [accounts, setAccounts] = useState<AccountOpt[]>([]);
  const [currentAccount, setCurrentAccount] = useState<AccountOpt | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [currentDivision, setCurrentDivision] = useState<Division | null>(null);
  const [rows, setRows] = useState<BirthdayRow[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BirthdayRow | null>(null);
  const [form, setForm] = useState({
    tipo: 'ALUMNO' as 'ALUMNO' | 'PADRE',
    fechaNacimiento: '',
    studentId: '' as string,
  });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<BirthdayRow | null>(null);

  useEffect(() => {
    if (!user) return;
    if (isSuperAdmin) {
      AccountService.getAccounts(1, 200)
        .then((r) => setAccounts(r.accounts || []))
        .catch(() => Notification.error('No se pudieron cargar instituciones'));
      return;
    }
    const load = async () => {
      try {
        const res = await apiClient.get(`/api/users/profile`);
        const body = res.data as { success?: boolean; data?: any } & Record<string, any>;
        const profile = body?.success && body?.data ? body.data : body;
        const acc = profile?.account || profile?.associations?.[0]?.account;
        if (acc?._id) {
          setCurrentAccount({ _id: acc._id, nombre: acc.nombre });
        } else if (user.account?._id) {
          setCurrentAccount({ _id: user.account._id, nombre: user.account.nombre });
        }
      } catch {
        if (user.account?._id) {
          setCurrentAccount({ _id: user.account._id, nombre: user.account.nombre });
        }
      }
    };
    load();
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (!currentAccount?._id) {
      setDivisions([]);
      setCurrentDivision(null);
      return;
    }
    grupoService.getGrupos(1, 500, '', currentAccount._id)
      .then((r) => setDivisions(r.grupos || []))
      .catch(() => Notification.error('Error cargando divisiones'));
  }, [currentAccount?._id]);

  const loadStudents = async () => {
    if (!currentAccount?._id || !currentDivision?._id) return;
    try {
      const res = await apiClient.get('/api/students', {
        params: { accountId: currentAccount._id, divisionId: currentDivision._id },
      });
      if (res.data.success) {
        setStudents(res.data.data.students || []);
      }
    } catch {
      setStudents([]);
    }
  };

  const loadBirthdays = async () => {
    if (!currentAccount?._id || !currentDivision?._id) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/api/birthdays', {
        params: { accountId: currentAccount._id, divisionId: currentDivision._id },
      });
      if (res.data.success) {
        setRows(res.data.data.birthdays || []);
      }
    } catch (e: any) {
      Notification.error(e.response?.data?.message || 'Error cargando cumpleaños');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBirthdays();
    loadStudents();
  }, [currentAccount?._id, currentDivision?._id]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      tipo: 'ALUMNO',
      fechaNacimiento: '',
      studentId: '',
    });
    setShowModal(true);
  };

  const openEdit = (row: BirthdayRow) => {
    setEditing(row);
    const d = new Date(row.fechaNacimiento);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setForm({
      tipo: row.tipo,
      fechaNacimiento: iso,
      studentId: row.student?._id || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!currentAccount?._id || !currentDivision?._id) {
      Notification.error('Selecciona institución y división');
      return;
    }
    if (!form.studentId) {
      Notification.error('Seleccioná un alumno de la división');
      return;
    }
    if (!form.fechaNacimiento) {
      Notification.error('Seleccioná la fecha de nacimiento');
      return;
    }
    try {
      if (editing) {
        await apiClient.put(`/api/birthdays/${editing._id}`, {
          tipo: form.tipo,
          fechaNacimiento: form.fechaNacimiento,
          studentId: form.studentId,
        });
      } else {
        await apiClient.post('/api/birthdays', {
          accountId: currentAccount._id,
          divisionId: currentDivision._id,
          studentId: form.studentId,
          tipo: form.tipo,
          fechaNacimiento: form.fechaNacimiento,
        });
      }
      setShowModal(false);
      await loadBirthdays();
      Notification.success(editing ? 'Actualizado' : 'Creado');
    } catch (e: any) {
      Notification.error(e.response?.data?.message || 'Error al guardar');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/api/birthdays/${deleteTarget._id}`);
      Notification.success('Eliminado');
      setDeleteTarget(null);
      loadBirthdays();
    } catch (e: any) {
      Notification.error(e.response?.data?.message || 'Error al eliminar');
    }
  };

  const downloadTemplate = () => {
    const data = [
      ['DNI_Alumno', 'Tipo', 'FechaNacimiento'],
      ['40123456', 'ALUMNO', '15/05/2018'],
      ['40123456', 'PADRE', '10/03/1985'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Cumpleaños');
    XLSX.writeFile(wb, 'plantilla_cumpleanos.xlsx');
  };

  const handleUpload = async () => {
    if (isReadonly) {
      Notification.error('No tenés permisos para cargar archivos.');
      return;
    }
    if (!uploadFile || !currentAccount?._id || !currentDivision?._id) {
      Notification.error('Archivo e institución/división requeridos');
      return;
    }
    setUploading(true);
    setUploadResults(null);
    const fd = new FormData();
    fd.append('excel', uploadFile);
    fd.append('accountId', currentAccount._id);
    fd.append('divisionId', currentDivision._id);
    try {
      const res = await apiClient.post('/api/birthdays/upload-excel', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResults(res.data.data || res.data);
      Notification.success(res.data.message || 'Carga finalizada');
      loadBirthdays();
    } catch (e: any) {
      Notification.error(e.response?.data?.message || 'Error en la carga');
    } finally {
      setUploading(false);
    }
  };

  if (isSuperAdmin && !currentAccount) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Cumpleaños por división</h2>
        <div className="bg-white shadow rounded-lg p-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Institución</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value=""
            onChange={(e) => {
              const a = accounts.find((x) => x._id === e.target.value);
              if (a) setCurrentAccount(a);
            }}
          >
            <option value="">Seleccionar…</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Cargando cuenta…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cake className="h-7 w-7 text-pink-500" />
            Cumpleaños
          </h2>
          <p className="text-gray-600">{currentAccount.nombre}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isReadonly && (
            <>
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center px-3 py-2 border rounded-md text-sm bg-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Excel
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center px-3 py-2 border rounded-md text-sm bg-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Plantilla
              </button>
            </>
          )}
          {!isReadonly && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 flex flex-wrap gap-4 items-end">
        {isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 min-w-[200px]"
              value={currentAccount._id}
              onChange={(e) => {
                const a = accounts.find((x) => x._id === e.target.value);
                if (a) {
                  setCurrentAccount(a);
                  setCurrentDivision(null);
                }
              }}
            >
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">División</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 min-w-[200px]"
            value={currentDivision?._id || ''}
            onChange={(e) => {
              const d = divisions.find((x) => x._id === e.target.value);
              setCurrentDivision(d || null);
            }}
          >
            <option value="">Seleccionar división…</option>
            {divisions.map((d) => (
              <option key={d._id} value={d._id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentDivision ? (
        <p className="text-gray-500">Elegí una división para ver y editar cumpleaños.</p>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay registros en esta división.</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nacimiento</th>
                {!isReadonly && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 text-sm">
                    {r.student
                      ? `${r.student.apellido}, ${r.student.nombre}${r.student.dni ? ` · DNI ${r.student.dni}` : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{r.tipo}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(r.fechaNacimiento).toLocaleDateString()}
                  </td>
                  {!isReadonly && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => openEdit(r)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4 inline" />
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => setDeleteTarget(r)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">{editing ? 'Editar' : 'Nuevo'} cumpleaños</h3>
            <p className="text-sm text-gray-600">
              El cumpleaños corresponde siempre a un alumno de la división: fecha del alumno o del padre/madre
              asociado a ese alumno.
            </p>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Alumno</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                <option value="">Seleccionar alumno…</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.apellido}, {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as 'ALUMNO' | 'PADRE' })}
              >
                <option value="ALUMNO">ALUMNO (fecha de nacimiento del alumno)</option>
                <option value="PADRE">PADRE (fecha de nacimiento del padre/madre)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={form.fechaNacimiento}
                onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md border text-sm"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm"
                onClick={save}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Cargar Excel</h3>
            <p className="text-sm text-gray-600">
              Columnas: <strong>DNI_Alumno</strong> (DNI del alumno en esa división), <strong>Tipo</strong> (ALUMNO o
              PADRE), <strong>FechaNacimiento</strong>.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            {uploadResults?.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-xs text-red-700 bg-red-50 p-2 rounded">
                {uploadResults.errors.map((err: any, i: number) => (
                  <div key={i}>
                    Fila {err.row}: {err.error}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 border rounded-md text-sm" onClick={() => setShowUpload(false)}>
                Cerrar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50"
                disabled={uploading}
                onClick={handleUpload}
              >
                {uploading ? 'Subiendo…' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Eliminar cumpleaños"
        message={
          deleteTarget && deleteTarget.student
            ? `¿Eliminar el cumpleaños (${deleteTarget.tipo}) de ${deleteTarget.student.apellido}, ${deleteTarget.student.nombre}?`
            : ''
        }
        onConfirm={remove}
        onClose={() => setDeleteTarget(null)}
        type="danger"
      />
    </div>
  );
};

