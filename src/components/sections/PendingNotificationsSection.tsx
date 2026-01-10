import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { CheckCircle, XCircle, RotateCw, Clock } from 'lucide-react';
import { pendingNotificationsService, PendingNotification } from '../../services/pendingNotificationsService';

interface PendingNotificationsSectionProps {
  isReadonly?: boolean;
}

export const PendingNotificationsSection: React.FC<PendingNotificationsSectionProps> = ({ isReadonly = false }) => {
  const [notifications, setNotifications] = useState<PendingNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<PendingNotification | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pendingNotificationsService.getPendingNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar notificaciones pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleApprove = async (notification: PendingNotification) => {
    try {
      await pendingNotificationsService.approveNotification(notification._id);
      await loadNotifications();
      setSelectedNotification(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al aprobar notificación');
    }
  };

  const handleReject = async () => {
    if (!selectedNotification) return;
    
    try {
      await pendingNotificationsService.rejectNotification(selectedNotification._id, rejectionReason);
      await loadNotifications();
      setShowRejectDialog(false);
      setSelectedNotification(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al rechazar notificación');
    }
  };

  const openRejectDialog = (notification: PendingNotification) => {
    setSelectedNotification(notification);
    setShowRejectDialog(true);
    setRejectionReason('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'informacion':
        return 'info';
      case 'comunicacion':
        return 'primary';
      case 'institucion':
        return 'success';
      case 'coordinador':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Notificaciones Pendientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aprobar o rechazar notificaciones enviadas por coordinadores antes de que lleguen a los padres
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RotateCw size={16} />}
          onClick={loadNotifications}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <Clock size={48} color="#9e9e9e" />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                No hay notificaciones pendientes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Todas las notificaciones han sido procesadas
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Título</strong></TableCell>
                <TableCell><strong>Mensaje</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Enviado por</strong></TableCell>
                <TableCell><strong>División</strong></TableCell>
                <TableCell><strong>Destinatarios</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {notification.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notification.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={notification.type}
                      color={getTypeColor(notification.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {notification.sender.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.sender.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {notification.division?.nombre || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {notification.recipientsCount} destinatarios
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(notification.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Aprobar">
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => handleApprove(notification)}
                          disabled={isReadonly}
                        >
                          <CheckCircle size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rechazar">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => openRejectDialog(notification)}
                          disabled={isReadonly}
                        >
                          <XCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Notificación</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {selectedNotification && (
              <>
                <Alert severity="warning">
                  ¿Estás seguro de que quieres rechazar esta notificación?
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  <strong>Título:</strong> {selectedNotification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Mensaje:</strong> {selectedNotification.message}
                </Typography>
                <TextField
                  label="Razón del rechazo (opcional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Explica por qué se rechaza esta notificación..."
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
