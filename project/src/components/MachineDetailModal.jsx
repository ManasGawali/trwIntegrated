import React, { useState, useEffect } from 'react';
import { X, Thermometer, Gauge, Activity, AlertTriangle, Phone, MessageSquare } from 'lucide-react';
import axios from 'axios';

const MachineDetailModal = ({ machine, isOpen, onClose }) => {
  const [temperatureData, setTemperatureData] = useState([]);
  const [pressureData, setPressureData] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    phoneNumber: '+91 70586 27122',
    enableSMS: true,
    enableCall: true
  });
  const [alerts, setAlerts] = useState([]);

  const chartWidth = 600;
  const chartHeight = 200;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };

  useEffect(() => {
    if (!isOpen || !machine) return;

    // Fetch historical data from InfluxDB via backend
    const fetchMachineHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/machine/${machine.id}/history`);
        const { temperatureData, pressureData } = response.data;
        setTemperatureData(temperatureData);
        setPressureData(pressureData);
      } catch (error) {
        console.error('Error fetching machine history:', error);
      }
    };

    fetchMachineHistory();

    // Real-time updates every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/machine/${machine.id}/history`);
        const { temperatureData: newTempData, pressureData: newPressData } = response.data;
        
        setTemperatureData(prev => {
          const newData = [...newTempData];
          const latestTemp = newData[newData.length - 1];
          if (latestTemp && latestTemp.value > latestTemp.threshold) {
            handleAlert('temperature', latestTemp.value, latestTemp.threshold);
          }
          return newData;
        });

        setPressureData(prev => {
          const newData = [...newPressData];
          const latestPress = newData[newData.length - 1];
          if (latestPress && latestPress.value > latestPress.threshold) {
            handleAlert('pressure', latestPress.value, latestPress.threshold);
          }
          return newData;
        });
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, machine]);

  const handleAlert = async (type, value, threshold) => {
    const alertMessage = `ALERT: ${machine.name} (${machine.id}) - ${type.toUpperCase()} THRESHOLD EXCEEDED! Current: ${value.toFixed(2)}, Threshold: ${threshold}`;
    
    const newAlert = {
      id: Date.now(),
      type,
      value,
      threshold,
      timestamp: new Date(),
      message: alertMessage
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);

    if (alertSettings.enableSMS || alertSettings.enableCall) {
      try {
        await axios.post('http://localhost:5000/api/send-alert', {
          phone: alertSettings.phoneNumber,
          message: alertMessage,
          sms: alertSettings.enableSMS,
          call: alertSettings.enableCall
        });
        console.log('Alert sent successfully');
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  };

  const renderChart = (data, title, color, unit) => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => Math.max(d.value, d.threshold))) * 1.1;
    const minValue = Math.min(...data.map(d => Math.min(d.value, d.threshold))) * 0.9;
    const valueRange = maxValue - minValue;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          {title === 'Temperature' ? <Thermometer className="w-5 h-5 mr-2" /> : <Gauge className="w-5 h-5 mr-2" />}
          {title} Monitoring
        </h4>
        
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1={margin.left}
              y1={margin.top + (i * (chartHeight - margin.top - margin.bottom) / 4)}
              x2={chartWidth - margin.right}
              y2={margin.top + (i * (chartHeight - margin.top - margin.bottom) / 4)}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {[0, 1, 2, 3, 4].map(i => (
            <text
              key={i}
              x={margin.left - 10}
              y={margin.top + (i * (chartHeight - margin.top - margin.bottom) / 4) + 5}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {(maxValue - (i * valueRange / 4)).toFixed(1)}
            </text>
          ))}
          
          <line
            x1={margin.left}
            y1={margin.top + ((maxValue - data[0].threshold) / valueRange) * (chartHeight - margin.top - margin.bottom)}
            x2={chartWidth - margin.right}
            y2={margin.top + ((maxValue - data[0].threshold) / valueRange) * (chartHeight - margin.top - margin.bottom)}
            stroke="#EF4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          <polyline
            points={data.map((point, index) => {
              const x = margin.left + (index * (chartWidth - margin.left - margin.right) / (data.length - 1));
              const y = margin.top + ((maxValue - point.value) / valueRange) * (chartHeight - margin.top - margin.bottom);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          
          {data.map((point, index) => {
            const x = margin.left + (index * (chartWidth - margin.left - margin.right) / (data.length - 1));
            const y = margin.top + ((maxValue - point.value) / valueRange) * (chartHeight - margin.top - margin.bottom);
            const isOverThreshold = point.value > point.threshold;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isOverThreshold ? "5" : "3"}
                fill={isOverThreshold ? "#EF4444" : color}
                className={isOverThreshold ? "animate-pulse" : ""}
              >
                <title>{`${point.value.toFixed(2)} ${unit} at ${new Date(point.timestamp).toLocaleTimeString()}`}</title>
              </circle>
            );
          })}
          
          <text
            x={chartWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-sm fill-gray-600"
          >
            Time (Last 30 minutes)
          </text>
          
          <text
            x={margin.left - 40}
            y={chartHeight / 2}
            textAnchor="middle"
            className="text-sm fill-gray-600"
            transform={`rotate(-90, ${margin.left - 40}, ${chartHeight / 2})`}
          >
            {title} ({unit})
          </text>
        </svg>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: color }}></div>
              <span>Current: {data[data.length - 1]?.value.toFixed(3)} {unit}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-red-500 rounded-full mr-2"></div>
              <span>Threshold: {data[0]?.threshold} {unit}</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            data[data.length - 1]?.value > data[0]?.threshold 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {data[data.length - 1]?.value > data[0]?.threshold ? 'OVER THRESHOLD' : 'NORMAL'}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen || !machine) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{machine.name} - Detailed Monitoring</h2>
            <p className="text-gray-600">Machine ID: {machine.id} | Status: {machine.status}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Efficiency</p>
                  <p className="text-2xl font-bold">{machine.efficiency.toFixed(3)}%</p>
                </div>
                <Activity className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Production</p>
                  <p className="text-2xl font-bold">{machine.production.toFixed(3)}</p>
                </div>
                <Activity className="w-8 h-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Temperature</p>
                  <p className="text-2xl font-bold">{machine.temperature.toFixed(3)}°C</p>
                </div>
                <Thermometer className="w-8 h-8 text-orange-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Pressure</p>
                  <p className="text-2xl font-bold">{machine.pressure.toFixed(3)} PSI</p>
                </div>
                <Gauge className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alert Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4/testing">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number for Alerts
                </label>
                <input
                  type="tel"
                  value={alertSettings.phoneNumber}
                  onChange={(e) => setAlertSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={alertSettings.enableSMS}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, enableSMS: e.target.checked }))}
                    className="mr-2"
                  />
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Enable SMS
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={alertSettings.enableCall}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, enableCall: e.target.checked }))}
                    className="mr-2"
                  />
                  <Phone className="w-4 h-4 mr-1" />
                  Enable Calls
                </label>
              </div>
              <div className="text-sm text-gray-600">
                <p>Temperature Threshold: {machine.tempThreshold}°C</p>
                <p>Pressure Threshold: {machine.pressureThreshold} PSI</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {renderChart(temperatureData, 'Temperature', '#F59E0B', '°C')}
            {renderChart(pressureData, 'Pressure', '#3B82F6', 'PSI')}
          </div>
          
          {alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Recent Alerts
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {alerts.map(alert => (
                  <div key={alert.id} className="bg-white border border-red-300 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-red-900">
                          {alert.type.toUpperCase()} Threshold Exceeded
                        </p>
                        <p className="text-sm text-red-700">
                          Current: {alert.value.toFixed(3)} | Threshold: {alert.threshold}
                        </p>
                      </div>
                      <span className="text-xs text-red-600">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineDetailModal;