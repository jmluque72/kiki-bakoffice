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
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Upload, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AccountService } from '../../services/accountService';
import { Account, apiClient } from '../../config/api';

interface Coordinador {
  _id: string;
  nombre: string;
  email: string;
  activo: boolean;
  asociacionId: string;
  fechaAsociacion: string;
  division: {
    _id: string;
    nombre: string;
    descripcion: string;
  };
  account: {
    _id: string;
    nombre: string;
    razonSocial: string;
  };
}

interface CoordinadoresSectionProps {
  userRole: string;
  isReadonly?: boolean;
}

const CoordinadoresSection = ({ userRole, isReadonly = false }: CoordinadoresSectionProps) => {
  const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedDivisionForUpload, setSelectedDivisionForUpload] = useState<any>(null);
  const [filterName, setFilterName] = useState<string>('');
  const [filterEmail, setFilterEmail] = useState<string>('');

  const loadAccounts = useCallback(async () => {
    // Solo cargar accounts si es superadmin
    if (userRole === 'superadmin') {
      try {
        const response = await AccountService.getAccounts();
        setAccounts(response.accounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    }
  }, [userRole]);

  const loadDivisions = useCallback(async (accountId: string) => {
    try {
      const response = await apiClient.get(`/api/groups/account/${accountId}?activo=true`);
      setDivisions(response.data.data.grupos || []);
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  }, []);

  const loadCoordinadores = useCallback(async () => {
    try {
      setLoading(true);
      
      // Siempre usar el endpoint que trae todos de la institución
      // Si hay división seleccionada, se filtrará en el frontend
      const url = `/api/coordinators`;
      
      const response = await apiClient.get(url);
      let coordinadores = response.data.data.coordinadores || [];
      
      // Filtrar por división si está seleccionada
      if (selectedDivision) {
        coordinadores = coordinadores.filter((coord: Coordinador) => 
          coord.division?._id === selectedDivision
        );
      }
      
      setCoordinadores(coordinadores);
      setTotalPages(Math.ceil(coordinadores.length / 10));
    } catch (error) {
      console.error('Error al cargar coordinadores:', error);
      setError('Error al cargar coordinadores');
    } finally {
      setLoading(false);
    }
  }, [selectedDivision]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccount && userRole === 'superadmin') {
      loadDivisions(selectedAccount);
      setSelectedDivision('');
    }
  }, [selectedAccount, loadDivisions, userRole]);

  // Cargar divisiones automáticamente si es adminaccount
  useEffect(() => {
    if (userRole === 'adminaccount') {
      // Para adminaccount, necesitamos obtener su cuenta y luego las divisiones
      const loadAdminAccountDivisions = async () => {
        try {
          // Primero obtener las asociaciones del usuario para saber a qué cuenta pertenece
          const response = await apiClient.get(`/api/users/profile`);

          const userData = response.data;
          // Asumimos que adminaccount tiene una asociación activa
          if (userData.associations && userData.associations.length > 0) {
            const accountId = userData.associations[0].account._id;
            setSelectedAccount(accountId); // Para referencia interna
            await loadDivisions(accountId);
          }
        } catch (error) {
          console.error('Error loading admin account divisions:', error);
        }
      };

      loadAdminAccountDivisions();
    }
  }, [userRole, loadDivisions]);

  useEffect(() => {
    // Cargar coordinadores automáticamente al montar el componente
    loadCoordinadores();
  }, [loadCoordinadores]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    setSelectedDivision('');
  };

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
  };

  const handleUploadCoordinators = (division: any) => {
    setSelectedDivisionForUpload(division);
    setShowUploadDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('🔄 Descargando plantilla...');
      
      const response = await apiClient.get(`/api/coordinators/template`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_coordinadores_${selectedDivisionForUpload?.nombre || 'division'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Error: El archivo no es un Excel válido');
      }
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      setError('Error al descargar la plantilla');
    }
  };

  const handleUploadSubmit = async () => {
    // Superadmin no puede cargar coordinadores
    if (userRole === 'superadmin') {
      setError('Los superadministradores solo pueden crear instituciones. La carga de coordinadores debe realizarse desde la institución.');
      return;
    }
    
    if (!uploadFile || !selectedDivisionForUpload) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('divisionId', selectedDivisionForUpload._id);

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
        setSelectedDivisionForUpload(null);
        loadCoordinadores(); // Recargar la lista
      } else {
        setError(result.message || 'Error al cargar coordinadores');
      }
    } catch (error) {
      console.error('Error al cargar coordinadores:', error);
      setError('Error al cargar coordinadores');
    }
  };

  const getStatusColor = (activo: boolean) => {
    return activo ? 'success' : 'error';
  };

  const getStatusText = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  const handleExportCoordinators = () => {
    if (coordinadores.length === 0) {
      setError('No hay coordinadores para exportar');
      return;
    }

    try {
      // Aplicar filtros si existen
      let dataToExport = coordinadores;
      
      if (filterName) {
        dataToExport = dataToExport.filter(coordinador =>
          coordinador.nombre.toLowerCase().includes(filterName.toLowerCase())
        );
      }
      
      if (filterEmail) {
        dataToExport = dataToExport.filter(coordinador =>
          coordinador.email.toLowerCase().includes(filterEmail.toLowerCase())
        );
      }

      // Preparar datos para Excel
      const excelData = dataToExport.map(coordinator => ({
        'Nombre': coordinator.nombre || '',
        'Email': coordinator.email || '',
        'División': coordinator.division?.nombre || 'N/A',
        'Institución': coordinator.account?.nombre || 'N/A',
        'Estado': coordinator.activo ? 'Activo' : 'Inactivo',
        'Fecha de Asociación': new Date(coordinator.fechaAsociacion).toLocaleDateString('es-AR')
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Coordinadores');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Nombre
        { wch: 35 }, // Email
        { wch: 20 }, // División
        { wch: 25 }, // Institución
        { wch: 15 }, // Estado
        { wch: 20 }  // Fecha de Asociación
      ];
      ws['!cols'] = colWidths;

      // Generar nombre de archivo con fecha
      const fileName = `coordinadores_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar coordinadores:', error);
      setError('Error al exportar coordinadores a Excel');
    }
  };

  // Superadmin no puede gestionar coordinadores, solo adminaccount
  const canManageCoordinadores = userRole === 'adminaccount';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Coordinadores
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestiona los coordinadores por institución y división.
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
            {userRole === 'superadmin' && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Institución</InputLabel>
                <Select
                  value={selectedAccount}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  label="Institución"
                >
                  {accounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.nombre} ({account.razonSocial})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {userRole === 'superadmin' && selectedAccount && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>División</InputLabel>
                <Select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  label="División"
                >
                  <MenuItem value="">Todas las divisiones</MenuItem>
                  {divisions.map((division) => (
                    <MenuItem key={division._id} value={division._id}>
                      {division.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {userRole === 'adminaccount' && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>División</InputLabel>
                <Select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  label="División"
                >
                  <MenuItem value="">Todas las divisiones</MenuItem>
                  {divisions.map((division) => (
                    <MenuItem key={division._id} value={division._id}>
                      {division.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {canManageCoordinadores && selectedDivision && (
              <Button
                variant="contained"
                startIcon={<Upload size={16} />}
                onClick={() => {
                  const division = divisions.find(d => d._id === selectedDivision);
                  if (division) handleUploadCoordinators(division);
                }}
                color="secondary"
              >
                Cargar Coordinadores
              </Button>
            )}
          </Box>

          {/* Filtros adicionales */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 2 }}>
            <TextField
              label="Filtrar por nombre"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Filtrar por email"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Coordinadores Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Cargando coordinadores...</Typography>
            </Box>
          ) : coordinadores.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography color="text.secondary">
                {selectedAccount || userRole === 'adminaccount' ? 'No hay coordinadores en la institución' : 'Selecciona una institución para ver coordinadores'}
              </Typography>
            </Box>
          ) : (
            <>
              {(() => {
                // Aplicar filtros
                let filteredCoordinadores = coordinadores;
                
                if (filterName) {
                  filteredCoordinadores = filteredCoordinadores.filter(coordinador =>
                    coordinador.nombre.toLowerCase().includes(filterName.toLowerCase())
                  );
                }
                
                if (filterEmail) {
                  filteredCoordinadores = filteredCoordinadores.filter(coordinador =>
                    coordinador.email.toLowerCase().includes(filterEmail.toLowerCase())
                  );
                }

                return (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Mostrando {filteredCoordinadores.length} de {coordinadores.length} coordinadores
                      </Typography>
                      <Button
                        onClick={handleExportCoordinators}
                        startIcon={<Download size={16} />}
                        variant="outlined"
                        color="primary"
                        size="small"
                      >
                        Exportar a Excel
                      </Button>
                    </Box>
                    
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Nombre</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>División</strong></TableCell>
                            <TableCell><strong>Institución</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell><strong>Fecha de Asociación</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCoordinadores.map((coordinador) => (
                      <TableRow key={coordinador._id}>
                        <TableCell>
                          <Typography variant="body2">
                            {coordinador.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {coordinador.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {coordinador.division?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {coordinador.account?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(coordinador.activo)}
                            color={getStatusColor(coordinador.activo) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(coordinador.fechaAsociacion).toLocaleDateString()}
                          </Typography>
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
                  </>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Coordinators Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Cargar Coordinadores - {selectedDivisionForUpload?.nombre}
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
                startIcon={<Download size={16} />}
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
    </Box>
  );
};

export default CoordinadoresSection;
