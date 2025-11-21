import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2, GripVertical, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formRequestService, FormRequest, FormQuestion } from '../services/formRequestService';

interface FormRequestWizardProps {
  form?: FormRequest | null;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

export const FormRequestWizard: React.FC<FormRequestWizardProps> = ({ form, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1: Información básica
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [status, setStatus] = useState<'borrador' | 'publicado'>('borrador');

  // Paso 2: Preguntas
  const [preguntas, setPreguntas] = useState<FormQuestion[]>([]);

  useEffect(() => {
    if (form) {
      setNombre(form.nombre);
      setDescripcion(form.descripcion || '');
      setStatus(form.status);
      setPreguntas(form.preguntas.map((p, index) => ({
        ...p,
        orden: index
      })));
    } else {
      // Inicializar con una pregunta vacía
      setPreguntas([{
        tipo: 'texto',
        texto: '',
        requerido: false,
        orden: 0
      }]);
    }
  }, [form]);

  const getAccountId = (): string | null => {
    if (user?.role?.nombre === 'superadmin') {
      return null; // Superadmin necesitará seleccionar la cuenta
    }
    if (user?.role?.nombre === 'adminaccount' && user?.associations?.length > 0) {
      return user.associations[0].account._id;
    }
    return user?.account?._id || null;
  };

  const handleAddQuestion = () => {
    const newQuestion: FormQuestion = {
      tipo: 'texto',
      texto: '',
      requerido: false,
      opciones: [],
      orden: preguntas.length
    };
    setPreguntas([...preguntas, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newPreguntas = preguntas.filter((_, i) => i !== index).map((p, i) => ({
      ...p,
      orden: i
    }));
    setPreguntas(newPreguntas);
  };

  const handleQuestionChange = (index: number, field: keyof FormQuestion, value: any) => {
    const newPreguntas = [...preguntas];
    newPreguntas[index] = {
      ...newPreguntas[index],
      [field]: value
    };
    setPreguntas(newPreguntas);
  };

  const handleAddOption = (questionIndex: number) => {
    const newPreguntas = [...preguntas];
    if (!newPreguntas[questionIndex].opciones) {
      newPreguntas[questionIndex].opciones = [];
    }
    newPreguntas[questionIndex].opciones!.push('');
    setPreguntas(newPreguntas);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newPreguntas = [...preguntas];
    newPreguntas[questionIndex].opciones = newPreguntas[questionIndex].opciones!.filter(
      (_, i) => i !== optionIndex
    );
    setPreguntas(newPreguntas);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newPreguntas = [...preguntas];
    newPreguntas[questionIndex].opciones![optionIndex] = value;
    setPreguntas(newPreguntas);
  };

  const validateStep1 = (): boolean => {
    if (!nombre.trim()) {
      setError('El nombre del formulario es obligatorio');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (preguntas.length === 0) {
      setError('Debes agregar al menos una pregunta');
      return false;
    }

    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];
      if (!pregunta.texto.trim()) {
        setError(`La pregunta ${i + 1} debe tener un texto`);
        return false;
      }

      // Solo validar opciones si el tipo de pregunta las requiere
      if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'checkbox') {
        if (!pregunta.opciones || pregunta.opciones.length === 0) {
          setError(`La pregunta ${i + 1} debe tener al menos una opción`);
          return false;
        }

        // Validar que todas las opciones tengan contenido
        for (let j = 0; j < pregunta.opciones.length; j++) {
          if (!pregunta.opciones[j].trim()) {
            setError(`La opción ${j + 1} de la pregunta ${i + 1} no puede estar vacía`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setLoading(true);
    try {
      const accountId = getAccountId();
      if (!accountId) {
        setError('No se pudo determinar la institución');
        setLoading(false);
        return;
      }

      const data = {
        nombre,
        descripcion,
        status,
        preguntas: preguntas.map((p, index) => ({
          tipo: p.tipo,
          texto: p.texto,
          requerido: p.requerido,
          opciones: (p.tipo === 'opcion_multiple' || p.tipo === 'checkbox') ? p.opciones : undefined,
          orden: index
        }))
      };

      if (form) {
        await formRequestService.updateFormRequest(form._id, data);
      } else {
        await formRequestService.createFormRequest(data);
      }

      onClose();
    } catch (err: any) {
      // Extraer el mensaje del servidor si está disponible
      const errorMessage = err.response?.data?.message || err.message || 'Error al guardar formulario';
      setError(errorMessage);
      console.error('Error al guardar formulario:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Formulario *
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Autorización de salida"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descripción opcional del formulario"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'borrador' | 'publicado')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="borrador">Borrador</option>
          <option value="publicado">Publicado</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Los formularios en borrador no son visibles para los tutores
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Preguntas</h3>
        <button
          type="button"
          onClick={handleAddQuestion}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Pregunta</span>
        </button>
      </div>

      {preguntas.map((pregunta, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GripVertical className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Pregunta {index + 1}</span>
            </div>
            {preguntas.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveQuestion(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Pregunta
            </label>
            <select
              value={pregunta.tipo}
              onChange={(e) => {
                const newTipo = e.target.value as 'texto' | 'opcion_multiple' | 'checkbox' | 'imagen' | 'archivo';
                
                // Actualizar el tipo y las opciones en una sola operación
                const newPreguntas = [...preguntas];
                newPreguntas[index] = {
                  ...newPreguntas[index],
                  tipo: newTipo,
                  opciones: (newTipo === 'opcion_multiple' || newTipo === 'checkbox') 
                    ? (newPreguntas[index].opciones && newPreguntas[index].opciones.length > 0 
                        ? newPreguntas[index].opciones 
                        : [''])
                    : undefined
                };
                setPreguntas(newPreguntas);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="texto">Texto</option>
              <option value="opcion_multiple">Opción Múltiple</option>
              <option value="checkbox">Checkbox (Múltiples opciones)</option>
              <option value="imagen">Imagen</option>
              <option value="archivo">Archivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto de la Pregunta *
            </label>
            <input
              type="text"
              value={pregunta.texto}
              onChange={(e) => handleQuestionChange(index, 'texto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: ¿Autoriza la salida del estudiante?"
            />
          </div>

          {(pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'checkbox') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opciones *
              </label>
              {pregunta.opciones?.map((opcion, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={opcion}
                    onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Opción ${optIndex + 1}`}
                  />
                  {pregunta.opciones!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index, optIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddOption(index)}
                className="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Opción</span>
              </button>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id={`requerido-${index}`}
              checked={pregunta.requerido}
              onChange={(e) => handleQuestionChange(index, 'requerido', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`requerido-${index}`} className="ml-2 text-sm text-gray-700">
              Pregunta requerida
            </label>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{nombre}</h3>
        {descripcion && (
          <p className="text-sm text-gray-600 mb-4">{descripcion}</p>
        )}
        <div className="space-y-4">
          {preguntas.map((pregunta, index) => (
            <div key={index} className="bg-white rounded-md p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {pregunta.texto}
                  {pregunta.requerido && <span className="text-red-500 ml-1">*</span>}
                </span>
                <span className="text-xs text-gray-500 capitalize">{pregunta.tipo}</span>
              </div>
              {pregunta.tipo === 'texto' && (
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  placeholder="Respuesta de texto"
                />
              )}
              {(pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'checkbox') && (
                <div className="space-y-2">
                  {pregunta.opciones?.map((opcion, optIndex) => (
                    <div key={optIndex} className="flex items-center">
                      <input
                        type={pregunta.tipo === 'opcion_multiple' ? 'radio' : 'checkbox'}
                        disabled
                        className="h-4 w-4 text-blue-600"
                      />
                      <label className="ml-2 text-sm text-gray-700">{opcion}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {form ? 'Editar Formulario' : 'Nuevo Formulario'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {step === 1 ? 'Información' : step === 2 ? 'Preguntas' : 'Vista Previa'}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-1 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

