import React from 'react';
import { Activity, Thermometer, Gauge, AlertTriangle } from 'lucide-react';

const MachineCard = ({ machine, onMachineClick }) => {
  // Defensive checks for machine prop
  if (!machine || !machine.id) {
    console.warn('Invalid machine data:', machine);
    return null;
  }

  // Default values for missing properties
  const {
    id = 'Unknown',
    name = 'Unknown Machine',
    status = 'unknown',
    efficiency = 0,
    production = 0,
    temperature = 0,
    pressure = 0,
    tempThreshold = 100,
    pressureThreshold = 200,
  } = machine;

  // Log warning for incomplete data
  if (production === 0 || temperature === 0 || pressure === 0 || tempThreshold === 0 || pressureThreshold === 0) {
    console.warn(`Incomplete data for ${id}:`, { production, temperature, pressure, tempThreshold, pressureThreshold });
  }

  // Format status safely
  const formattedStatus = status && typeof status === 'string'
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Unknown';

  // Determine status color
  const statusColor = {
    running: 'bg-green-100 text-green-700',
    idle: 'bg-yellow-100 text-yellow-700',
    maintenance: 'bg-orange-100 text-orange-700',
    unknown: 'bg-gray-100 text-gray-700',
  }[status.toLowerCase()] || 'bg-gray-100 text-gray-700';

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onMachineClick(machine)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{name} ({id})</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {formattedStatus}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-sm text-gray-600">Efficiency</p>
            <p className="text-base font-medium">{efficiency > 0 ? efficiency.toFixed(1) : 'N/A'}%</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-sm text-gray-600">Production</p>
            <p className="text-base font-medium">{production > 0 ? production.toFixed(1) : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Thermometer className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-sm text-gray-600">Temperature</p>
            <p className="text-base font-medium">{temperature > 0 ? temperature.toFixed(1) : 'N/A'}°C</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-purple-500" />
          <div>
            <p className="text-sm text-gray-600">Pressure</p>
            <p className="text-base font-medium">{pressure > 0 ? pressure.toFixed(1) : 'N/A'} PSI</p>
          </div>
        </div>
      </div>
      
      {(temperature > tempThreshold || pressure > pressureThreshold) && (temperature > 0 || pressure > 0) && (
        <div className="mt-3 flex items-center text-red-600">
          <AlertTriangle className="w-4 h-4 mr-1" />
          <span className="text-sm">Threshold Exceeded</span>
        </div>
      )}
    </div>
  );
};

export default MachineCard;