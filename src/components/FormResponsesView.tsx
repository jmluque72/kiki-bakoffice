import React, { useState, useEffect } from 'react';
import { X, Eye, Loader2, AlertCircle, CheckCircle, Clock, Download, Check, XCircle } from 'lucide-react';
import { formRequestService, FormRequest, FormResponse } from '../services/formRequestService';
import * as XLSX from 'xlsx';

interface FormResponsesViewProps {
  formRequest: FormRequest;
  onClose: () => void;
}

export const FormResponsesView: React.FC<FormResponsesViewProps> = ({
  formRequest,
  onClose
}) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [exporting, setExporting] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadResponses();
  }, [formRequest._id]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allResponses = await formRequestService.getFormResponses(formRequest._id);
      setResponses(allResponses);
    } catch (err: any) {
      console.error('Error cargando respuestas:', err);
      setError(err.message || 'Error al cargar respuestas');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setRejectReason('');
    setShowRejectModal(false);
  };

  const handleApprove = async (responseId: string) => {
    try {
      setProcessing(responseId);
      await formRequestService.approveFormResponse(responseId);
      await loadResponses();
      if (selectedResponse?._id === responseId) {
        const updated = await formRequestService.getFormResponses(formRequest._id);
        const updatedResponse = updated.find(r => r._id === responseId);
        if (updatedResponse) {
          setSelectedResponse(updatedResponse);
        }
      }
    } catch (err: any) {
      console.error('Error aprobando respuesta:', err);
      alert('Error al aprobar respuesta: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (responseId: string) => {
    if (!rejectReason.trim()) {
      alert('Por favor, ingresa un motivo de rechazo');
      return;
    }
    try {
      setProcessing(responseId);
      await formRequestService.rejectFormResponse(responseId, rejectReason);
      await loadResponses();
      if (selectedResponse?._id === responseId) {
        const updated = await formRequestService.getFormResponses(formRequest._id);
        const updatedResponse = updated.find(r => r._id === responseId);
        if (updatedResponse) {
          setSelectedResponse(updatedResponse);
        }
      }
      setShowRejectModal(false);
      setRejectReason('');
      alert('Respuesta rechazada. El tutor deberá completarla nuevamente.');
    } catch (err: any) {
      console.error('Error rechazando respuesta:', err);
      alert('Error al rechazar respuesta: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Aprobado</span>
          </span>
        );
      case 'completado':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completado</span>
          </span>
        );
      case 'rechazado':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>En Progreso</span>
          </span>
        );
    }
  };

  const handleExport = () => {
    if (responses.length === 0) {
      alert('No hay respuestas para exportar');
      return;
    }
    
    try {
      setExporting(true);
      
      // Preparar datos para exportar
      const exportData = responses.map((response) => {
        const row: any = {
          'Tutor': response.tutor.name,
          'Email Tutor': response.tutor.email,
          'Alumno': `${response.student.nombre} ${response.student.apellido}`,
          'DNI Alumno': response.student.dni,
          'División': response.division?.nombre || '-',
          'Estado': response.estado === 'aprobado' ? 'Aprobado' : 
                    response.estado === 'completado' ? 'Completado' :
                    response.estado === 'rechazado' ? 'Rechazado' : 'En Progreso',
          'Fecha Aprobación': response.fechaAprobacion 
            ? new Date(response.fechaAprobacion).toLocaleDateString('es-AR')
            : '-',
          'Motivo Rechazo': response.motivoRechazo || '-',
          'Fecha Completado': response.fechaCompletado 
            ? new Date(response.fechaCompletado).toLocaleDateString('es-AR')
            : '-'
        };
        
        // Agregar cada pregunta y su respuesta
        formRequest.preguntas.forEach((pregunta, index) => {
          const respuesta = response.respuestas.find(r => r.preguntaId === pregunta._id);
          let respuestaTexto = 'Sin respuesta';
          if (respuesta) {
            if (Array.isArray(respuesta.valor)) {
              respuestaTexto = respuesta.valor.join(', ');
            } else if (pregunta.tipo === 'imagen' || pregunta.tipo === 'archivo') {
              // Para imágenes y archivos, incluir la URL completa
              respuestaTexto = `https://kiki-bucket-app.s3.amazonaws.com/${respuesta.valor}`;
            } else {
              respuestaTexto = respuesta.valor;
            }
          }
          row[`Pregunta ${index + 1}: ${pregunta.texto}`] = respuestaTexto;
        });
        
        return row;
      });
      
      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Respuestas');
      
      // Ajustar ancho de columnas
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 20)
      }));
      ws['!cols'] = colWidths;
      
      // Exportar archivo
      const fileName = `Respuestas_${formRequest.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (err: any) {
      console.error('Error exportando respuestas:', err);
      alert('Error al exportar respuestas: ' + (err.message || 'Error desconocido'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Respuestas del Formulario</h2>
            <p className="text-sm text-gray-600 mt-1">{formRequest.nombre}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              disabled={exporting || responses.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Exportar a Excel</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando respuestas...</span>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay respuestas
              </h3>
              <p className="text-gray-500">
                Aún no hay respuestas para este formulario
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alumno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      División
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Completado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses.map((response) => (
                    <tr key={response._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {response.tutor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {response.tutor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {response.student.nombre} {response.student.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          DNI: {response.student.dni}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {response.division?.nombre || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(response.estado || (response.completado ? 'completado' : 'en_progreso'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {response.fechaCompletado
                            ? new Date(response.fechaCompletado).toLocaleDateString('es-AR')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {(response.estado === 'completado' || (response.completado && !response.estado)) && (
                            <>
                              <button
                                onClick={() => handleApprove(response._id)}
                                disabled={processing === response._id}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                                title="Aprobar respuesta"
                              >
                                {processing === response._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>Aprobar</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedResponse(response);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing === response._id}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                                title="Rechazar respuesta"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>Rechazar</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewResponse(response)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>

        {/* Response Detail Modal */}
        {selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Detalle de Respuesta</h3>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 space-y-2">
                  <p><strong>Tutor:</strong> {selectedResponse.tutor.name} ({selectedResponse.tutor.email})</p>
                  <p><strong>Alumno:</strong> {selectedResponse.student.nombre} {selectedResponse.student.apellido}</p>
                  <p><strong>División:</strong> {selectedResponse.division?.nombre || '-'}</p>
                  <p><strong>Estado:</strong> {getStatusBadge(selectedResponse.estado || (selectedResponse.completado ? 'completado' : 'en_progreso'))}</p>
                  {selectedResponse.fechaAprobacion && (
                    <p><strong>Fecha Aprobación:</strong> {new Date(selectedResponse.fechaAprobacion).toLocaleDateString('es-AR')}</p>
                  )}
                  {selectedResponse.motivoRechazo && (
                    <p><strong>Motivo Rechazo:</strong> <span className="text-red-600">{selectedResponse.motivoRechazo}</span></p>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Respuestas:</h4>
                  {formRequest.preguntas.map((pregunta, index) => {
                    const respuesta = selectedResponse.respuestas.find(
                      r => r.preguntaId === pregunta._id
                    );
                    return (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="mb-2">
                          <span className="font-medium text-gray-900">{pregunta.texto}</span>
                          {pregunta.requerido && <span className="text-red-500 ml-1">*</span>}
                          <span className="ml-2 text-xs text-gray-500 capitalize">({pregunta.tipo})</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {respuesta ? (
                            Array.isArray(respuesta.valor) ? (
                              <ul className="list-disc list-inside">
                                {respuesta.valor.map((v, i) => (
                                  <li key={i}>{v}</li>
                                ))}
                              </ul>
                            ) : pregunta.tipo === 'imagen' ? (
                              <div className="mt-2">
                                <img 
                                  src={`https://kiki-bucket-app.s3.amazonaws.com/${respuesta.valor}`}
                                  alt="Imagen de respuesta"
                                  className="max-w-xs max-h-48 rounded-md border border-gray-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">{respuesta.valor}</p>
                              </div>
                            ) : pregunta.tipo === 'archivo' ? (
                              <div className="mt-2">
                                <a
                                  href={`https://kiki-bucket-app.s3.amazonaws.com/${respuesta.valor}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  📄 Ver archivo
                                </a>
                                <p className="text-xs text-gray-500 mt-1">{respuesta.valor}</p>
                              </div>
                            ) : (
                              <p>{respuesta.valor}</p>
                            )
                          ) : (
                            <p className="text-gray-400 italic">Sin respuesta</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  {selectedResponse.estado === 'completado' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedResponse._id)}
                        disabled={processing === selectedResponse._id}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {processing === selectedResponse._id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Aprobar</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={processing === selectedResponse._id}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Rechazar</span>
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedResponse(null);
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Rechazar Respuesta</h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que deseas rechazar esta respuesta? El tutor deberá completarla nuevamente.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ingresa el motivo del rechazo..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(selectedResponse._id)}
                  disabled={processing === selectedResponse._id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing === selectedResponse._id ? 'Procesando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

