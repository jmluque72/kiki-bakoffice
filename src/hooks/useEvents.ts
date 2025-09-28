import { useState, useEffect, useCallback } from 'react';
import { EventService, Event, CreateEventRequest } from '../services/eventService';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  const loadEvents = useCallback(async (filters: {
    page?: number;
    limit?: number;
    institucion?: string;
    division?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    search?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const result = await EventService.getEvents(filters);
      
      setEvents(result.events);
      setPagination({
        currentPage: result.page,
        totalPages: Math.ceil(result.total / result.limit),
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < Math.ceil(result.total / result.limit),
        hasPrevPage: result.page > 1
      });

    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData: CreateEventRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await EventService.createEvent(eventData);
      
      if (result.success) {
        // Add the new event to the list if data is available
        if (result.data) {
          setEvents(prev => [result.data!, ...prev]);
        }
        return true;
      } else {
        setError(result.message || 'Error al crear evento');
        return false;
      }

    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Error al crear evento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, eventData: Partial<CreateEventRequest>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await EventService.updateEvent(eventId, eventData);
      
      if (result.success && result.data) {
        // Update the event in the list
        setEvents(prev => prev.map(event => 
          event._id === eventId ? result.data! : event
        ));
        return true;
      } else {
        setError(result.message || 'Error al actualizar evento');
        return false;
      }

    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message || 'Error al actualizar evento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await EventService.deleteEvent(eventId);
      
      if (result.success) {
        // Remove the event from the list
        setEvents(prev => prev.filter(event => event._id !== eventId));
        return true;
      } else {
        setError(result.message || 'Error al eliminar evento');
        return false;
      }

    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Error al eliminar evento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEvents = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    events,
    loading,
    error,
    pagination,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    clearError
  };
};