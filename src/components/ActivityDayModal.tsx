import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User, 
  Image as ImageIcon,
  Video,
  List,
  CheckSquare,
  Clipboard,
  MessageSquare
} from 'lucide-react';

interface Activity {
  _id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  estado: 'borrador' | 'publicada';
  categoria: string;
  imagenes: string[];
  objetivos: string[];
  materiales: string[];
  evaluacion: string;
  observaciones: string;
  participantes: any[];
  creador: {
    name: string;
  };
  institucion: {
    _id: string;
    nombre: string;
  };
  division?: {
    _id: string;
    nombre: string;
  };
}

interface ActivityDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  activities: Activity[];
  onStatusChange?: (activityId: string, newStatus: 'borrador' | 'publicada') => void;
  onDelete?: (activityId: string) => void;
  userRole?: string;
}

export const ActivityDayModal: React.FC<ActivityDayModalProps> = ({
  isOpen,
  onClose,
  date,
  activities,
  onStatusChange,
  onDelete,
  userRole
}) => {
  // Función para detectar si una URL es un video
  const isVideo = (url: string): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    
    // Verificar por extensión de archivo
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.quicktime'];
    const hasVideoExtension = videoExtensions.some(ext => urlLower.includes(ext));
    
    // Verificar por patrones de URL de S3 que contengan videos
    const isS3Video = urlLower.includes('uploads/') && (
      urlLower.includes('.mp4') || 
      urlLower.includes('.mov') || 
      urlLower.includes('.avi') ||
      urlLower.includes('.mkv') ||
      urlLower.includes('.wmv') ||
      urlLower.includes('.flv') ||
      urlLower.includes('.webm') ||
      urlLower.includes('.m4v') ||
      urlLower.includes('.quicktime')
    );
    
    // Verificar por parámetros de query que indiquen video
    const hasVideoParams = urlLower.includes('contenttype=video') || 
                          urlLower.includes('content-type=video') ||
                          urlLower.includes('type=video');
    
    return hasVideoExtension || isS3Video || hasVideoParams;
  };

  // Separar imágenes y videos
  const separateMedia = (mediaUrls: string[]) => {
    const images: string[] = [];
    const videos: string[] = [];
    
    console.log('🎬 [ACTIVITY_MODAL] Separando medios:', mediaUrls);
    
    mediaUrls.forEach((url, index) => {
      const isVideoResult = isVideo(url);
      console.log(`🎬 [ACTIVITY_MODAL] URL ${index + 1}:`, url);
      console.log(`🎬 [ACTIVITY_MODAL] Es video:`, isVideoResult);
      
      if (isVideoResult) {
        videos.push(url);
      } else {
        images.push(url);
      }
    });
    
    console.log('🎬 [ACTIVITY_MODAL] Resultado separación:', { images: images.length, videos: videos.length });
    
    return { images, videos };
  };
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'academica': return 'bg-blue-100 text-blue-800';
      case 'deportiva': return 'bg-green-100 text-green-800';
      case 'cultural': return 'bg-purple-100 text-purple-800';
      case 'recreativa': return 'bg-yellow-100 text-yellow-800';
      case 'social': return 'bg-indigo-100 text-indigo-800';
      case 'otra': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (estado: 'borrador' | 'publicada') => {
    switch (estado) {
      case 'borrador': return 'bg-yellow-100 text-yellow-800';
      case 'publicada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (activityId: string, newStatus: 'borrador' | 'publicada') => {
    if (onStatusChange) {
      onStatusChange(activityId, newStatus);
    }
  };

  const handleDelete = (activityId: string) => {
    if (onDelete) {
      onDelete(activityId);
    }
  };

  const displayDate = formatDate(date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Actividades del {displayDate}</h2>
              <p className="text-gray-600">{activities.length} actividad{activities.length !== 1 ? 'es' : ''} programada{activities.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No hay actividades programadas</p>
              <p className="text-sm text-gray-400">No se encontraron actividades para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Activity Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{activity.titulo}</h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityCategoryColor(activity.categoria)}`}>
                          {activity.categoria.charAt(0).toUpperCase() + activity.categoria.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Description */}
                  <p className="text-gray-600 mb-4">{activity.descripcion}</p>

                  {/* Activity Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Fecha y Hora</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(activity.fecha)} - {activity.hora}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Ubicación</p>
                          <p className="text-sm text-gray-600">{activity.lugar || 'No especificada'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Organizador</p>
                          <p className="text-sm text-gray-600">{activity.creador?.name || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Participantes</p>
                          <p className="text-sm text-gray-600">
                            {activity.participantes.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Estado</p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.estado)}`}>
                              {activity.estado.charAt(0).toUpperCase() + activity.estado.slice(1)}
                            </span>
                            {onStatusChange && (
                              <button
                                onClick={() => handleStatusChange(activity._id, activity.estado === 'borrador' ? 'publicada' : 'borrador')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                  activity.estado === 'borrador' 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                }`}
                              >
                                {activity.estado === 'borrador' ? 'Publicar' : 'Marcar como Borrador'}
                              </button>
                            )}
                            {onDelete && userRole === 'adminaccount' && (
                              <button
                                onClick={() => handleDelete(activity._id)}
                                className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media (Images and Videos) */}
                  {activity.imagenes && activity.imagenes.length > 0 && (() => {
                    const { images, videos } = separateMedia(activity.imagenes);
                    return (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        {/* Images */}
                        {images.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                              <h4 className="text-sm font-medium text-gray-900">Imágenes ({images.length})</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Actividad imagen ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {videos.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Video className="h-5 w-5 text-gray-400" />
                              <h4 className="text-sm font-medium text-gray-900">Videos ({videos.length})</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {videos.map((video, index) => (
                                <div key={index} className="relative">
                                  <video
                                    src={video}
                                    controls
                                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                                    preload="metadata"
                                  >
                                    Tu navegador no soporta la reproducción de videos.
                                  </video>
                                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                    Video {index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Objectives */}
                  {activity.objetivos && activity.objetivos.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <List className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Objetivos</h4>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                        {activity.objetivos.map((obj, index) => (
                          <li key={index}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Materials */}
                  {activity.materiales && activity.materiales.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Clipboard className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Materiales</h4>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                        {activity.materiales.map((mat, index) => (
                          <li key={index}>{mat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Evaluation */}
                  {activity.evaluacion && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckSquare className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Evaluación</h4>
                      </div>
                      <p className="text-sm text-gray-600">{activity.evaluacion}</p>
                    </div>
                  )}

                  {/* Observations */}
                  {activity.observaciones && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Observaciones</h4>
                      </div>
                      <p className="text-sm text-gray-600">{activity.observaciones}</p>
                    </div>
                  )}

                  {/* Participants */}
                  {activity.participantes && activity.participantes.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-900">Participantes</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activity.participantes.map((participant, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {participant.nombre?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{participant.nombre}</p>
                              <p className="text-xs text-gray-600">{participant.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
