import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../config/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Pickup {
  _id: string;
  account: {
    _id: string;
    nombre: string;
  };
  division: {
    _id: string;
    nombre: string;
  };
  student: {
    _id: string;
    nombre: string;
    apellido: string;
    tutor?: {
      _id: string;
      name?: string;
      nombre?: string;
      apellido?: string;
      email?: string;
    };
  };
  nombre: string;
  apellido: string;
  dni: string;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface Division {
  _id: string;
  nombre: string;
}

interface Student {
  _id: string;
  nombre: string;
  apellido: string;
}

interface PickupSectionProps {
  isReadonly?: boolean;
}

const PickupSection: React.FC<PickupSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Estados para filtros
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [pickupSearch, setPickupSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  
  // Estados para modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<Pickup | null>(null);
  const [formData, setFormData] = useState({
    division: '',
    student: '',
    nombre: '',
    apellido: '',
    dni: ''
  });

  // Obtener accountId según el rol del usuario
  const getAccountId = async (): Promise<string | null> => {
    if (!user) return null;
    
    // Para superadmin, necesitaría seleccionar una cuenta (por ahora retornamos null)
    if (user.role?.nombre === 'superadmin') {
      // TODO: Implementar selector de cuenta para superadmin
      return null;
    }
    
    // Para adminaccount, obtener de las asociaciones
    if (user.role?.nombre === 'adminaccount') {
      try {
        const response = await apiClient.get(`/api/users/profile`);
        const userData = response.data;
        if (userData.associations && userData.associations.length > 0) {
          return userData.associations[0].account._id;
        }
      } catch (error) {
        console.error('Error obteniendo cuenta del usuario:', error);
      }
    }
    
    // Fallback: intentar desde user.account
    return user.account?._id || null;
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      const accountId = await getAccountId();
      if (accountId) {
        await loadPickups(accountId);
        await loadDivisions(accountId);
      }
    };
    
    loadData();
  }, [user, pagination.page, selectedDivision, selectedStudent]);

  const loadPickups = async (accountId?: string) => {
    try {
      setLoading(true);
      const finalAccountId = accountId || await getAccountId();
      if (!finalAccountId) {
        console.log('No se pudo obtener accountId');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (selectedDivision && selectedDivision !== 'all') {
        params.append('division', selectedDivision);
      }
      if (selectedStudent && selectedStudent !== 'all') {
        params.append('student', selectedStudent);
      }

      const response = await apiClient.get(`/pickup/account/${finalAccountId}?${params}`);
      
      if (response.data.success) {
        setPickups(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error al cargar personas autorizadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDivisions = async (accountId?: string) => {
    try {
      const finalAccountId = accountId || await getAccountId();
      if (!finalAccountId) return;

      const response = await apiClient.get(`/divisions/account/${finalAccountId}`);
      if (response.data.success) {
        setDivisions(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar divisiones:', error);
    }
  };

  const loadStudents = async (divisionId: string) => {
    try {
      const response = await apiClient.get(`/students/division/${divisionId}`);
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
  };

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
    setSelectedStudent('all');
    setStudents([]);
    if (divisionId && divisionId !== 'all') {
      loadStudents(divisionId);
    }
  };

  const handleCreatePickup = async () => {
    try {
      const accountId = await getAccountId();
      if (!accountId) {
        alert('No se pudo obtener la cuenta. Por favor, recarga la página.');
        return;
      }

      const pickupData = {
        account: accountId,
        division: formData.division,
        student: formData.student,
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        createdBy: user?._id
      };

      const response = await apiClient.post('/pickup', pickupData);
      
      if (response.data.success) {
        setIsModalOpen(false);
        resetForm();
        loadPickups();
      }
    } catch (error: any) {
      console.error('Error al crear persona autorizada:', error);
      alert(error.response?.data?.message || 'Error al crear persona autorizada');
    }
  };

  const handleUpdatePickup = async () => {
    try {
      if (!editingPickup) return;

      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni
      };

      const response = await apiClient.put(`/pickup/${editingPickup._id}`, updateData);
      
      if (response.data.success) {
        setIsModalOpen(false);
        resetForm();
        loadPickups();
      }
    } catch (error: any) {
      console.error('Error al actualizar persona autorizada:', error);
      alert(error.response?.data?.message || 'Error al actualizar persona autorizada');
    }
  };

  const handleDeletePickup = async (pickupId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta persona autorizada?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/pickup/${pickupId}`);
      
      if (response.data.success) {
        loadPickups();
      }
    } catch (error: any) {
      console.error('Error al eliminar persona autorizada:', error);
      alert(error.response?.data?.message || 'Error al eliminar persona autorizada');
    }
  };

  const openEditModal = (pickup: Pickup) => {
    setEditingPickup(pickup);
    setFormData({
      division: pickup.division._id,
      student: pickup.student._id,
      nombre: pickup.nombre,
      apellido: pickup.apellido,
      dni: pickup.dni
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingPickup(null);
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      division: '',
      student: '',
      nombre: '',
      apellido: '',
      dni: ''
    });
  };

  const getTutorName = (pickup: Pickup) => {
    const tutor = pickup.student?.tutor;
    if (tutor) {
      const tutorFullName = `${tutor.nombre || ''} ${tutor.apellido || ''}`.trim();
      return tutor.name || tutorFullName || tutor.email || '';
    }
    return pickup.createdBy?.name || pickup.createdBy?.email || '';
  };

  const normalize = (value?: string) => (value || '').toLowerCase();

  const filteredPickups = pickups.filter(pickup => {
    const pickupFullName = normalize(`${pickup.nombre} ${pickup.apellido}`);
    const pickupDni = normalize(pickup.dni);
    const studentFullName = normalize(`${pickup.student?.nombre || ''} ${pickup.student?.apellido || ''}`);
    const tutorName = normalize(getTutorName(pickup));

    const pickupSearchLower = normalize(pickupSearch);
    const studentSearchLower = normalize(studentSearch);
    const tutorSearchLower = normalize(tutorSearch);

    const matchesPickup = pickupSearchLower
      ? pickupFullName.includes(pickupSearchLower) || pickupDni.includes(pickupSearchLower)
      : true;

    const matchesStudent = studentSearchLower
      ? studentFullName.includes(studentSearchLower)
      : true;

    const matchesTutor = tutorSearchLower
      ? tutorName.includes(tutorSearchLower)
      : true;

    return matchesPickup && matchesStudent && matchesTutor;
  });

  const handleExport = () => {
    if (filteredPickups.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }

    const exportData = filteredPickups.map(pickup => {
      const studentName = `${pickup.student?.nombre || ''} ${pickup.student?.apellido || ''}`.trim();
      const tutorName = getTutorName(pickup) || 'Sin tutor';
      const pickupName = `${pickup.nombre} ${pickup.apellido}`.trim();

      return {
        'División': pickup.division?.nombre || '-',
        'Alumno': studentName || '-',
        'Tutor': tutorName || '-',
        'Quién retira': pickupName,
        'DNI': pickup.dni || '-',
        'Estado': pickup.status === 'active' ? 'Activo' : 'Inactivo',
        'Registrado por': pickup.createdBy?.name || pickup.createdBy?.email || '-',
        'Fecha de registro': pickup.createdAt ? new Date(pickup.createdAt).toLocaleDateString('es-AR') : '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personas Autorizadas');
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 18 }
    ];

    const fileName = `quien_retira_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold">Personas Autorizadas a Retirar</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredPickups.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="division">División</Label>
              <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las divisiones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las divisiones</SelectItem>
                  {divisions.map((division) => (
                    <SelectItem key={division._id} value={division._id}>
                      {division.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="student">Estudiante</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estudiantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estudiantes</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.nombre} {student.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pickupSearch">Quién retira</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="pickupSearch"
                  placeholder="Nombre, apellido o DNI de quien retira..."
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="studentSearch">Alumno</Label>
              <Input
                id="studentSearch"
                placeholder="Buscar por nombre de alumno..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tutorSearch">Tutor</Label>
              <Input
                id="tutorSearch"
                placeholder="Buscar por tutor o responsable..."
                value={tutorSearch}
                onChange={(e) => setTutorSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona Autorizada</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>División</TableHead>
                <TableHead>Registrado Por</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredPickups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No se encontraron personas autorizadas
                  </TableCell>
                </TableRow>
              ) : (
                filteredPickups.map((pickup) => (
                  <TableRow key={pickup._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {pickup.nombre} {pickup.apellido}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{pickup.dni}</TableCell>
                    <TableCell>
                      {pickup.student.nombre} {pickup.student.apellido}
                    </TableCell>
                    <TableCell>
                      {getTutorName(pickup) ? (
                        <span className="text-sm text-gray-700">{getTutorName(pickup)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Sin tutor</span>
                      )}
                    </TableCell>
                    <TableCell>{pickup.division.nombre}</TableCell>
                    <TableCell>{pickup.createdBy?.name || pickup.createdBy?.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={pickup.status === 'active' ? 'default' : 'secondary'}>
                        {pickup.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal para crear/editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPickup ? 'Editar Persona Autorizada' : 'Agregar Persona Autorizada'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="division">División *</Label>
              <Select 
                value={formData.division} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, division: value, student: '' }));
                  if (value) loadStudents(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar división" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division._id} value={division._id}>
                      {division.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="student">Estudiante *</Label>
              <Select 
                value={formData.student} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, student: value }))}
                disabled={!formData.division}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.nombre} {student.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                placeholder="12345678"
                maxLength={8}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={editingPickup ? handleUpdatePickup : handleCreatePickup}
              disabled={!formData.division || !formData.student || !formData.nombre || !formData.apellido || !formData.dni}
            >
              {editingPickup ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickupSection;
