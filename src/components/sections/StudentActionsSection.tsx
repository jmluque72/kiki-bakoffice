import React, { useState } from 'react';
import { Settings, Calendar } from 'lucide-react';
import StudentActionsManagement from '../StudentActionsManagement';
import { StudentActionsCalendar } from '../StudentActionsCalendar';
import { StudentActionsDayModal } from '../StudentActionsDayModal';
import { useDivisions } from '../../hooks/useDivisions';
import { StudentActionLog } from '../../services/studentActionService';

interface StudentActionsSectionProps {
  isReadonly?: boolean;
}

const StudentActionsSection: React.FC<StudentActionsSectionProps> = ({ isReadonly = false }) => {
  const { divisions, loading: divisionsLoading } = useDivisions();
  const [activeTab, setActiveTab] = useState<'management' | 'calendar'>('management');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateActions, setSelectedDateActions] = useState<StudentActionLog[]>([]);

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
  };

  const handleDateClick = (date: string, actions: StudentActionLog[]) => {
    setSelectedDate(date);
    setSelectedDateActions(actions);
    setShowDayModal(true);
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('management')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'management'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Gestionar Acciones</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'calendar'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Ver Acciones Registradas</span>
          </div>
        </button>
      </div>

              {/* Content */}
              {activeTab === 'management' ? (
                <StudentActionsManagement />
              ) : (
                <div className="space-y-6">
                  {/* Selector de División */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <label htmlFor="division-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar División *
                    </label>
                    {divisionsLoading ? (
                      <div className="text-gray-500">Cargando divisiones...</div>
                    ) : (
                      <select
                        id="division-select"
                        value={selectedDivision}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Selecciona una división para ver sus acciones registradas</option>
                        {divisions.map((division) => (
                          <option key={division._id} value={division._id}>
                            {division.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedDivision && (
                      <p className="mt-2 text-sm text-gray-600">
                        División seleccionada: {divisions.find(d => d._id === selectedDivision)?.nombre}
                      </p>
                    )}
                  </div>

                  {/* Calendario */}
                  {selectedDivision ? (
                    <StudentActionsCalendar
                      selectedDivision={selectedDivision}
                      onDateClick={handleDateClick}
                    />
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Selecciona una división para ver el calendario de acciones registradas</p>
                    </div>
                  )}
                </div>
              )}

      {/* Modal de acciones del día */}
      <StudentActionsDayModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        date={selectedDate}
        actions={selectedDateActions}
      />
    </div>
  );
};

export { StudentActionsSection };
export default StudentActionsSection;