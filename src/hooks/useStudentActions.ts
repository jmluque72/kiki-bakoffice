import { useState, useEffect } from 'react';
import { studentActionService, StudentAction, CreateStudentActionRequest, UpdateStudentActionRequest } from '../services/studentActionService';

export const useStudentActions = (divisionId?: string) => {
  const [actions, setActions] = useState<StudentAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar acciones por división o todas las acciones
  const loadActions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      if (divisionId) {
        data = await studentActionService.getActionsByDivision(divisionId);
      } else {
        data = await studentActionService.getAllActions();
      }
      setActions(data);
    } catch (err) {
      setError('Error al cargar las acciones');
      console.error('Error cargando acciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva acción
  const createAction = async (actionData: CreateStudentActionRequest) => {
    try {
      const newAction = await studentActionService.createAction(actionData);
      setActions(prev => [...prev, newAction]);
      return newAction;
    } catch (err) {
      setError('Error al crear la acción');
      console.error('Error creando acción:', err);
      throw err;
    }
  };

  // Actualizar acción
  const updateAction = async (actionId: string, actionData: UpdateStudentActionRequest) => {
    try {
      const updatedAction = await studentActionService.updateAction(actionId, actionData);
      setActions(prev => prev.map(action => 
        action._id === actionId ? updatedAction : action
      ));
      return updatedAction;
    } catch (err) {
      setError('Error al actualizar la acción');
      console.error('Error actualizando acción:', err);
      throw err;
    }
  };

  // Eliminar acción
  const deleteAction = async (actionId: string) => {
    try {
      await studentActionService.deleteAction(actionId);
      setActions(prev => prev.filter(action => action._id !== actionId));
    } catch (err) {
      setError('Error al eliminar la acción');
      console.error('Error eliminando acción:', err);
      throw err;
    }
  };

  // Cambiar estado de acción (activo/inactivo)
  const toggleActionStatus = async (actionId: string, newStatus: boolean) => {
    try {
      const updatedAction = await studentActionService.updateAction(actionId, { activo: newStatus });
      setActions(prev => prev.map(action => 
        action._id === actionId ? updatedAction : action
      ));
      return updatedAction;
    } catch (err) {
      setError('Error al cambiar el estado de la acción');
      console.error('Error cambiando estado:', err);
      throw err;
    }
  };

  // Cargar acciones cuando cambie la división
  useEffect(() => {
    loadActions();
  }, [divisionId]);

  return {
    actions,
    loading,
    error,
    createAction,
    updateAction,
    deleteAction,
    toggleActionStatus,
    loadActions
  };
};
