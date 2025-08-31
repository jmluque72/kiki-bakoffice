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
import { AccountService } from '../../services/accountService';
import { Account } from '../../config/api';

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
}

const TutoresSection = ({ userRole }: TutoresSectionProps) => {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('kiki_token');
      
      const response = await fetch(`${API_BASE_URL}/api/groups/account/${accountId}?activo=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDivisions(result.data.grupos || []);
      }
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  }, []);

  const loadTutores = useCallback(async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('kiki_token');
      
      let url = `${API_BASE_URL}/api/tutors`;
      if (selectedDivision) {
        url = `${API_BASE_URL}/api/tutors/by-division/${selectedDivision}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTutores(result.data.tutores || []);
        setTotalPages(Math.ceil((result.data.tutores?.length || 0) / 10));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar tutores');
      }
    } catch (error) {
      console.error('Error al cargar tutores:', error);
      setError('Error al cargar tutores');
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
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const token = localStorage.getItem('kiki_token');
          
          // Primero obtener las asociaciones del usuario para saber a qué cuenta pertenece
          const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            // Asumimos que adminaccount tiene una asociación activa
            if (userData.associations && userData.associations.length > 0) {
              const accountId = userData.associations[0].account._id;
              setSelectedAccount(accountId); // Para referencia interna
              await loadDivisions(accountId);
            }
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
                {selectedAccount ? 'No hay tutores en la selección actual' : 'Selecciona una institución para ver tutores'}
              </Typography>
            </Box>
          ) : (
            <>
              {(() => {
                // Aplicar filtros
                let filteredTutores = tutores;
                
                if (filterName) {
                  filteredTutores = filteredTutores.filter(tutor =>
                    tutor.nombre.toLowerCase().includes(filterName.toLowerCase())
                  );
                }
                
                if (filterEmail) {
                  filteredTutores = filteredTutores.filter(tutor =>
                    tutor.email.toLowerCase().includes(filterEmail.toLowerCase())
                  );
                }

                return (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mostrando {filteredTutores.length} de {tutores.length} tutores
                      </Typography>
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
