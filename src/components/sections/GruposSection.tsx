import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Pagination
} from '@mui/material';
import { GraduationCap, Upload, Users } from 'lucide-react';
import { grupoService, Grupo, CreateGrupoRequest, UpdateGrupoRequest } from '../../services/grupoService';
import { AccountService } from '../../services/accountService';
import { Account, apiClient } from '../../config/api';
import { ConfirmationDialog } from '../ConfirmationDialog';

interface GruposSectionProps {
  userRole: string;
  onSectionChange?: (section: string) => void;
}

const GruposSection = ({ userRole, onSectionChange }: GruposSectionProps) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedGrupoForUpload, setSelectedGrupoForUpload] = useState<Grupo | null>(null);
  const [showCoordinatorsDialog, setShowCoordinatorsDialog] = useState(false);
  const [selectedGrupoForCoordinators, setSelectedGrupoForCoordinators] = useState<Grupo | null>(null);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cuentaId: '',
    activo: true
  });

  const loadAccounts = useCallback(async () => {
    try {
      const response = await AccountService.getAccounts();
      setAccounts(response.accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }, []);

  const loadGrupos = useCallback(async () => {
    try {
      const response = await grupoService.getGrupos(page, 10, searchTerm, selectedAccount || undefined);
      setGrupos(response.grupos);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error cargando grupos');
    }
  }, [page, searchTerm, selectedAccount]);

  useEffect(() => {
    loadAccounts();
    loadGrupos();
  }, [loadAccounts, loadGrupos]);

  const handleOpenDialog = (grupo?: Grupo) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nombre: grupo.nombre,
        descripcion: grupo.descripcion || '',
        cuentaId: grupo.cuenta._id,
        activo: grupo.activo
      });
    } else {
      setEditingGrupo(null);
      setFormData({
        nombre: '',
        descripcion: '',
        cuentaId: '',
        activo: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGrupo(null);
    setFormData({
      nombre: '',
      descripcion: '',
      cuentaId: '',
      activo: true
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingGrupo) {
        const updateData: UpdateGrupoRequest = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          activo: formData.activo
        };
        await grupoService.updateGrupo(editingGrupo._id, updateData);
      } else {
        const createData: CreateGrupoRequest = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          cuentaId: formData.cuentaId
        };
        await grupoService.createGrupo(createData);
      }
      handleCloseDialog();
      loadGrupos();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error guardando grupo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await grupoService.deleteGrupo(id);
      loadGrupos();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error eliminando grupo');
    }
  };

  const handleDeleteClick = (grupo: Grupo) => {
    setGrupoToDelete(grupo);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (grupoToDelete) {
      handleDelete(grupoToDelete._id);
    }
  };

  const handleUploadCoordinators = (grupo: Grupo) => {
    setSelectedGrupoForUpload(grupo);
    setShowUploadDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedGrupoForUpload) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('divisionId', selectedGrupoForUpload._id);

    try {
      const response = await apiClient.post(`/api/coordinators/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      if (result.success) {
        alert(`Carga completada. ${result.data.success} coordinadores cargados exitosamente.`);
        setShowUploadDialog(false);
        setUploadFile(null);
        setSelectedGrupoForUpload(null);
      } else {
        setError(result.message || 'Error al cargar coordinadores');
      }
    } catch (error) {
      console.error('Error al cargar coordinadores:', error);
      setError('Error al cargar coordinadores');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('🔄 Descargando plantilla...');
      
      const response = await apiClient.get(`/api/coordinators/template`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      console.log('📄 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        const blob = new Blob([response.data], { type: contentType });
        console.log('📦 Blob creado:', blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_coordinadores_${selectedGrupoForUpload?.nombre || 'division'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ Descarga completada');
      } else {
        console.error('❌ Content-Type incorrecto:', contentType);
        setError('Error: El archivo no es un Excel válido');
      }
    } catch (error) {
      console.error('❌ Error al descargar plantilla:', error);
      setError('Error al descargar la plantilla');
    }
  };

  const handleViewCoordinators = async (grupo: Grupo) => {
    try {
      setLoadingCoordinators(true);
      setSelectedGrupoForCoordinators(grupo);
      
      const response = await apiClient.get(`/api/coordinators/by-division/${grupo._id}`);
      setCoordinators(response.data.data.coordinadores);
      setShowCoordinatorsDialog(true);
    } catch (error) {
      console.error('Error al cargar coordinadores:', error);
      setError('Error al cargar coordinadores');
    } finally {
      setLoadingCoordinators(false);
    }
  };

  const handleManageStudents = (grupo: Grupo) => {
    // Guardar la división seleccionada en localStorage para que StudentsSection pueda acceder
    localStorage.setItem('selectedDivisionForStudents', JSON.stringify(grupo));
    localStorage.setItem('selectedAccountForStudents', JSON.stringify(grupo.cuenta));
    
    // Cambiar a la sección de alumnos
    if (onSectionChange) {
      onSectionChange('alumnos');
    }
  };

  const getStatusColor = (activo: boolean) => {
    return activo ? 'success' : 'error';
  };

  const getStatusText = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  const canManageGrupos = userRole === 'superadmin' || userRole === 'adminaccount';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Divisiones
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestiona las divisiones por cuenta. {userRole === 'superadmin' ? 'Puedes ver todas las divisiones.' : 'Solo puedes gestionar las divisiones de tus cuentas.'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Buscar por nombre"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por cuenta</InputLabel>
              <Select
                value={selectedAccount}
                onChange={(e: any) => setSelectedAccount(e.target.value as string)}
                label="Filtrar por cuenta"
              >
                <MenuItem value="">Todas las cuentas</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {canManageGrupos && (
              <Button
                variant="contained"
                onClick={() => handleOpenDialog()}
                sx={{ ml: 'auto' }}
              >
                Nueva División
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Cuenta</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado por</TableCell>
              <TableCell>Fecha</TableCell>
              {canManageGrupos && <TableCell>Acciones</TableCell>}
              <TableCell>Alumnos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grupos.map((grupo) => (
              <TableRow key={grupo._id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {grupo.nombre}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {grupo.descripcion || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {grupo.cuenta.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {grupo.cuenta.razonSocial}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(grupo.activo)}
                    color={getStatusColor(grupo.activo) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {grupo.creadoPor.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {grupo.creadoPor.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(grupo.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                {canManageGrupos && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(grupo)}
                        color="primary"
                        title="Editar división"
                      >
                        ✏️
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleUploadCoordinators(grupo)}
                        color="secondary"
                        title="Cargar coordinadores"
                      >
                        <Upload size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(grupo)}
                        color="error"
                        title="Eliminar división"
                      >
                        🗑️
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<GraduationCap size={16} />}
                      onClick={() => handleManageStudents(grupo)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Alumnos
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Users size={16} />}
                      onClick={() => handleViewCoordinators(grupo)}
                      disabled={loadingCoordinators}
                      sx={{ minWidth: 'auto' }}
                    >
                      Coordinadores
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_: React.ChangeEvent<unknown>, value: number) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGrupo ? 'Editar División' : 'Nueva División'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            {!editingGrupo && userRole === 'superadmin' && (
              <FormControl fullWidth required>
                <InputLabel>Cuenta</InputLabel>
                <Select
                  value={formData.cuentaId}
                  onChange={(e: any) => setFormData({ ...formData, cuentaId: e.target.value as string })}
                  label="Cuenta"
                >
                  {accounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.nombre} ({account.razonSocial})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {!editingGrupo && userRole === 'adminaccount' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                El grupo se creará automáticamente en tu cuenta asociada.
              </Alert>
            )}

            {editingGrupo && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                }
                label="Activo"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.nombre || (!editingGrupo && userRole === 'superadmin' && !formData.cuentaId)}
          >
            {editingGrupo ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar división"
        message={`¿Estás seguro de que quieres eliminar la división "${grupoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        type="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Upload Coordinators Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Cargar Coordinadores - {selectedGrupoForUpload?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Formato del archivo Excel:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Columna A:</strong> Nombre del coordinador
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Columna B:</strong> Email del coordinador
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Columna C:</strong> DNI del coordinador
              </Typography>
              <Typography variant="body2" component="div">
                • La primera fila debe contener los encabezados
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                startIcon={<Upload size={16} />}
                color="primary"
              >
                Descargar Plantilla
              </Button>
              <Typography variant="caption" color="text.secondary">
                Descarga una plantilla Excel con el formato correcto y datos de ejemplo
              </Typography>
            </Box>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ marginTop: '16px' }}
            />
            
            {uploadFile && (
              <Alert severity="success">
                Archivo seleccionado: {uploadFile.name}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={!uploadFile}
            color="secondary"
          >
            Cargar Coordinadores
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Coordinators Dialog */}
      <Dialog open={showCoordinatorsDialog} onClose={() => setShowCoordinatorsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Coordinadores - {selectedGrupoForCoordinators?.nombre}
        </DialogTitle>
        <DialogContent>
          {loadingCoordinators ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Cargando coordinadores...</Typography>
            </Box>
          ) : coordinators.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography color="text.secondary">
                No hay coordinadores asignados a esta división
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Fecha de Asociación</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coordinators.map((coordinator) => (
                    <TableRow key={coordinator._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {coordinator.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {coordinator.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={coordinator.activo ? 'Activo' : 'Inactivo'}
                          color={coordinator.activo ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(coordinator.fechaAsociacion).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCoordinatorsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GruposSection; 