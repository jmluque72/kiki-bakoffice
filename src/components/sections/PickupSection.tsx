import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
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
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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
  };
  nombre: string;
  apellido: string;
  dni: string;
  createdBy: {
    _id: string;
    name: string;
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
  const { apiClient } = useApi();
  
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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Cargar datos iniciales
  useEffect(() => {
    loadPickups();
    loadDivisions();
  }, [pagination.page, selectedDivision, selectedStudent]);

  const loadPickups = async () => {
    try {
      setLoading(true);
      const accountId = user?.account?._id;
      if (!accountId) return;

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

      const response = await apiClient.get(`/pickup/account/${accountId}?${params}`);
      
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

  const loadDivisions = async () => {
    try {
      const accountId = user?.account?._id;
      if (!accountId) return;

      const response = await apiClient.get(`/divisions/account/${accountId}`);
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
      const accountId = user?.account?._id;
      if (!accountId) return;

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

  const filteredPickups = pickups.filter(pickup => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pickup.nombre.toLowerCase().includes(searchLower) ||
      pickup.apellido.toLowerCase().includes(searchLower) ||
      pickup.dni.includes(searchTerm) ||
      pickup.student.nombre.toLowerCase().includes(searchLower) ||
      pickup.student.apellido.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Personas Autorizadas a Retirar</h2>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Persona
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nombre, apellido, DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
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
                <TableHead>División</TableHead>
                <TableHead>Registrado Por</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
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
                    <TableCell>{pickup.division.nombre}</TableCell>
                    <TableCell>{pickup.createdBy.name}</TableCell>
                    <TableCell>
                      <Badge variant={pickup.status === 'active' ? 'default' : 'secondary'}>
                        {pickup.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(pickup)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePickup(pickup._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
