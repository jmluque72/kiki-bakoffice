import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress, IconButton, Tooltip, Chip
} from '@mui/material';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { NotificationTemplateService, NotificationTemplate, CreateTemplateRequest } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

interface NotificationTemplatesSectionProps {
  isReadonly?: boolean;
}

export const NotificationTemplatesSection: React.FC<NotificationTemplatesSectionProps> = ({ isReadonly = false }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState<CreateTemplateRequest>({
    nombre: '',
    texto: '',
    accountId: ''
  });

  const accountId = user?.account?._id || '';

  useEffect(() => {
    if (accountId) {
      loadTemplates();
    }
  }, [accountId]);

  const loadTemplates = async () => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await NotificationTemplateService.getTemplates(accountId);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      nombre: '',
      texto: '',
      accountId: accountId
    });
    setDialogMode('create');
    setSelectedTemplate(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (template: NotificationTemplate) => {
    setFormData({
      nombre: template.nombre,
      texto: template.texto,
      accountId: template.account._id
    });
    setDialogMode('edit');
    setSelectedTemplate(template);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      texto: '',
      accountId: accountId
    });
    setSelectedTemplate(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.texto.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (formData.nombre.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return;
    }

    if (formData.texto.length > 500) {
      setError('El texto no puede exceder 500 caracteres');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (dialogMode === 'create') {
        await NotificationTemplateService.createTemplate(formData);
      } else if (selectedTemplate) {
        await NotificationTemplateService.updateTemplate(selectedTemplate._id, {
          nombre: formData.nombre,
          texto: formData.texto
        });
      }

      await loadTemplates();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Error al guardar template');
      console.error('Error saving template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: NotificationTemplate) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el template "${template.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await NotificationTemplateService.deleteTemplate(template._id);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar template');
      console.error('Error deleting template:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Templates de Notificaciones
        </Typography>
        {!isReadonly && (
          <Button
            variant="contained"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateDialog}
            disabled={loading || !accountId}
          >
            Nuevo Template
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && templates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              No hay templates creados. {!isReadonly && 'Crea uno nuevo para comenzar.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Texto</strong></TableCell>
                <TableCell><strong>Creado por</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template._id}>
                  <TableCell>{template.nombre}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {template.texto}
                    </Typography>
                  </TableCell>
                  <TableCell>{template.creadoPor.name || template.creadoPor.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={template.activo ? 'Activo' : 'Inactivo'}
                      color={template.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {!isReadonly && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(template)}
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(template)}
                            disabled={loading}
                            color="error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear/editar template */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Nuevo Template' : 'Editar Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              required
              helperText={`${formData.nombre.length}/100 caracteres`}
              error={formData.nombre.length > 100}
            />
            <TextField
              label="Texto"
              value={formData.texto}
              onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
              fullWidth
              required
              multiline
              rows={6}
              helperText={`${formData.texto.length}/500 caracteres`}
              error={formData.texto.length > 500}
            />
            {error && (
              <Alert severity="error">{error}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.nombre.trim() || !formData.texto.trim() || formData.nombre.length > 100 || formData.texto.length > 500}
          >
            {loading ? <CircularProgress size={20} /> : dialogMode === 'create' ? 'Crear' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
