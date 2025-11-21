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
import { Upload, Download, Users, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AccountService } from '../../services/accountService';
import { Account, apiClient } from '../../config/api';

interface Tutor {
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
  student?: {
    _id: string;
    nombre: string;
    apellido: string;
  };
}

interface TutoresSectionProps {
  userRole: string;
  isReadonly?: boolean;
}

const TutoresSection = ({ userRole, isReadonly = false }: TutoresSectionProps) => {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const loadTutores = useCallback(async () => {
    try {
      setLoading(true);
      
      // Siempre usar el endpoint que trae todos de la institución
      const url = `/api/tutors`;
      
      const response = await apiClient.get(url);
      const tutores = response.data.data.tutores || [];
      
      setTutores(tutores);
      setTotalPages(Math.ceil(tutores.length / 10));
    } catch (error) {
      console.error('Error al cargar tutores:', error);
      setError('Error al cargar tutores');
    } finally {
      setLoading(false);
    }
  }, []);

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
    // Cargar tutores automáticamente al montar el componente
    loadTutores();
  }, [loadTutores]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    setSelectedDivision('');
  };

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
  };

  const getStatusColor = (activo: boolean) => {
    return activo ? 'success' : 'error';
  };

  const getStatusText = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  const handleExportTutores = () => {
    if (tutores.length === 0) {
      setError('No hay tutores para exportar');
      return;
    }

    try {
      // Aplicar filtro de búsqueda si existe
      let dataToExport = tutores;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        dataToExport = dataToExport.filter(tutor => {
          const nombre = tutor.nombre?.toLowerCase() || '';
          const email = tutor.email?.toLowerCase() || '';
          const division = tutor.division?.nombre?.toLowerCase() || '';
          const alumno = tutor.student ? `${tutor.student.nombre} ${tutor.student.apellido}`.toLowerCase() : '';
          
          return nombre.includes(search) || 
                 email.includes(search) || 
                 division.includes(search) ||
                 alumno.includes(search);
        });
      }

      // Preparar datos para Excel
      const excelData = dataToExport.map(tutor => ({
        'Nombre': tutor.nombre || '',
        'Email': tutor.email || '',
        'División': tutor.division?.nombre || 'N/A',
        'Institución': tutor.account?.nombre || 'N/A',
        'Alumno Asignado': tutor.student ? `${tutor.student.nombre} ${tutor.student.apellido}` : 'N/A',
        'Estado': tutor.activo ? 'Activo' : 'Inactivo',
        'Fecha de Asociación': new Date(tutor.fechaAsociacion).toLocaleDateString('es-AR')
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tutores');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Nombre
        { wch: 35 }, // Email
        { wch: 20 }, // División
        { wch: 25 }, // Institución
        { wch: 25 }, // Alumno Asignado
        { wch: 15 }, // Estado
        { wch: 20 }  // Fecha de Asociación
      ];
      ws['!cols'] = colWidths;

      // Generar nombre de archivo con fecha
      const fileName = `tutores_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar tutores:', error);
      setError('Error al exportar tutores a Excel');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tutores
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gestiona los tutores por institución y división.
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

          </Box>

          {/* Filtro de búsqueda */}
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Buscar"
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    <Search size={16} style={{ color: '#9CA3AF' }} />
                  </Box>
                )
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tutores Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Cargando tutores...</Typography>
            </Box>
          ) : tutores.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography color="text.secondary">
                {selectedAccount || userRole === 'adminaccount' ? 'No hay tutores en la institución' : 'Selecciona una institución para ver tutores'}
              </Typography>
            </Box>
          ) : (
            <>
              {(() => {
                // Aplicar filtro de búsqueda
                let filteredTutores = tutores;
                
                if (searchTerm) {
                  const search = searchTerm.toLowerCase();
                  filteredTutores = filteredTutores.filter(tutor => {
                    const nombre = tutor.nombre?.toLowerCase() || '';
                    const email = tutor.email?.toLowerCase() || '';
                    const division = tutor.division?.nombre?.toLowerCase() || '';
                    const alumno = tutor.student ? `${tutor.student.nombre} ${tutor.student.apellido}`.toLowerCase() : '';
                    
                    return nombre.includes(search) || 
                           email.includes(search) || 
                           division.includes(search) ||
                           alumno.includes(search);
                  });
                }

                return (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Mostrando {filteredTutores.length} de {tutores.length} tutores
                      </Typography>
                      <Button
                        onClick={handleExportTutores}
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
                            <TableCell><strong>Alumno Asignado</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell><strong>Fecha de Asociación</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredTutores.map((tutor) => (
                      <TableRow key={tutor._id}>
                        <TableCell>
                          <Typography variant="body2">
                            {tutor.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tutor.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tutor.division?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tutor.account?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tutor.student ? `${tutor.student.nombre} ${tutor.student.apellido}` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(tutor.activo)}
                            color={getStatusColor(tutor.activo) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(tutor.fechaAsociacion).toLocaleDateString()}
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
    </Box>
  );
};

export default TutoresSection;
