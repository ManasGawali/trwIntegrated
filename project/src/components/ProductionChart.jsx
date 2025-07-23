import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, Activity, Play, Pause, RotateCcw } from 'lucide-react';
import axios from 'axios';

const ProductionChart = ({ selectedMachine }) => {
  const [currentHour, setCurrentHour] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [productionData, setProductionData] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const chartWidth = 800;
  const chartHeight = 400;
  const margin = { top: 20, right: 30, bottom: 80, left: 80 };

  const dailyTarget = selectedMachine ? 2400 : 12000;
  const hourlyTarget = dailyTarget / 24;

  useEffect(() => {
    if (!isRunning) return;

    const fetchProductionData = async () => {
      try {
        const endpoint = selectedMachine 
          ? `http://localhost:5000/api/production/${selectedMachine.id}`
          : `http://localhost:5000/api/production/all`;
        const response = await axios.get(endpoint);
        const data = response.data;

        setProductionData(data);
        
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setCurrentHour(latest.hour);
          setCurrentDay(latest.day);
        }
      } catch (error) {
        console.error('Error fetching production data:', error);
      }
    };

    fetchProductionData();

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      if (timeElapsed % 10 === 0) {
        fetchProductionData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeElapsed, selectedMachine]);

  const resetSimulation = async () => {
    setCurrentHour(0);
    setCurrentDay(1);
    setProductionData([]);
    setTimeElapsed(0);
    setIsRunning(true);
    
    // Note: In a real application, you might want to clear InfluxDB data or reset the simulation state on the backend
  };

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const currentData = productionData[productionData.length - 1];
  const currentCumulative = currentData?.cumulative || 0;
  const expectedAtThisTime = hourlyTarget * (currentHour + 1);
  const variance = expectedAtThisTime > 0 ? ((currentCumulative - expectedAtThisTime) / expectedAtThisTime) * 100 : 0;
  const completionRate = (currentCumulative / dailyTarget) * 100;

  let status = 'on-track';
  if (variance > 10) status = 'ahead';
  else if (variance < -10) status = 'behind';

  const getStatusColor = (status) => {
    switch (status) {
      case 'ahead': return 'text-green-600 bg-green-50 border-green-200';
      case 'behind': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ahead': return <TrendingUp className="w-4 h-4" />;
      case 'behind': return <TrendingDown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const maxCumulative = Math.max(dailyTarget, currentCumulative, expectedAtThisTime);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Real-time Production Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">Live simulation: 10 seconds = 1 hour</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Day {currentDay}, Hour {currentHour}</span>
          </div>
          <button
            onClick={toggleSimulation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            onClick={resetSimulation}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Total</p>
              <p className="text-2xl font-bold">{currentCumulative.toLocaleString()}</p>
            </div>
            <Activity className={`w-6 h-6 text-blue-200 ${isRunning ? 'animate-pulse' : ''}`} />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Expected Now</p>
              <p className="text-2xl font-bold">{Math.round(expectedAtThisTime).toLocaleString()}</p>
            </div>
            <Target className="w-6 h-6 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Daily Target</p>
              <p className="text-2xl font-bold">{dailyTarget.toLocaleString()}</p>
            </div>
            <Clock className="w-6 h-6 text-purple-200" />
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border-2 ${getStatusColor(status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Variance</p>
              <p className="text-2xl font-bold">{variance.toFixed(1)}%</p>
            </div>
            {getStatusIcon(status)}
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border-2 ${getStatusColor(status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Progress</p>
              <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
            </div>
            <div className="w-8 h-8 relative">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="opacity-20"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${Math.min(100, completionRate) * 0.88} 88`}
                  className="transition-all duration-500"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={margin.top + (i * (chartHeight - margin.top - margin.bottom) / 5)}
                x2={chartWidth - margin.right}
                y2={margin.top + (i * (chartHeight - margin.top - margin.bottom) / 5)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
              <line
                x1={margin.left + (i * (chartWidth - margin.left - margin.right) / 5)}
                y1={margin.top}
                x2={margin.left + (i * (chartWidth - margin.left - margin.right) / 5)}
                y2={chartHeight - margin.bottom}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </g>
          ))}
          
          {[0, 1, 2, 3, 4, 5].map(i => (
            <text
              key={i}
              x={margin.left - 10}
              y={margin.top + (i * (chartHeight - margin.top - margin.bottom) / 5) + 5}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {Math.round(maxCumulative * (1 - i / 5)).toLocaleString()}
            </text>
          ))}
          
          <line
            x1={margin.left}
            y1={chartHeight - margin.bottom}
            x2={margin.left + (chartWidth - margin.left - margin.right)}
            y2={margin.top}
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="8,4"
            className="opacity-80"
          />
          
          <text
            x={margin.left + (chartWidth - margin.left - margin.right) * 0.7}
            y={margin.top + (chartHeight - margin.top - margin.bottom) * 0.2}
            className="text-sm fill-green-600 font-medium"
          >
            Ideal Target (y=x)
          </text>
          
          {productionData.length > 1 && (
            <polyline
              points={productionData.map((point, index) => {
                const x = margin.left + (index * (chartWidth - margin.left - margin.right) / 23);
                const y = chartHeight - margin.bottom - (point.cumulative / maxCumulative) * (chartHeight - margin.top - margin.bottom);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="4"
              className="drop-shadow-lg"
            />
          )}
          
          {productionData.map((point, index) => {
            const x = margin.left + (index * (chartWidth - margin.left - margin.right) / 23);
            const y = chartHeight - margin.bottom - (point.cumulative / maxCumulative) * (chartHeight - margin.top - margin.bottom);
            const targetY = chartHeight - margin.bottom - (point.target / maxCumulative) * (chartHeight - margin.top - margin.bottom);
            const isCurrentHour = point.hour === currentHour;
            const variance = point.cumulative - point.target;
            const isAhead = variance > 0;
            
            return (
              <g key={`point-${index}`}>
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={targetY}
                  stroke={isAhead ? "#10B981" : "#EF4444"}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  className="opacity-50"
                />
                
                <circle
                  cx={x}
                  cy={targetY}
                  r="3"
                  fill="#10B981"
                  className="opacity-70"
                >
                  <title>Target: {Math.round(point.target)} units</title>
                </circle>
                
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrentHour ? "8" : "6"}
                  fill="#3B82F6"
                  className={`transition-all duration-300 cursor-pointer drop-shadow-md ${
                    isCurrentHour ? 'animate-pulse' : 'hover:r-8'
                  }`}
                >
                  <title>
                    {`Hour ${point.hour}
Cumulative: ${point.cumulative} units
Target: ${Math.round(point.target)} units
Hourly: ${point.actualHourly} units
Variance: ${variance > 0 ? '+' : ''}${Math.round(variance)} units`}
                  </title>
                </circle>
                
                {isCurrentHour && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    className="opacity-50 animate-ping"
                  />
                )}
                
                <text
                  x={x}
                  y={chartHeight - margin.bottom + 20}
                  textAnchor="middle"
                  className={`text-xs ${isCurrentHour ? 'fill-blue-600 font-bold' : 'fill-gray-500'}`}
                >
                  {point.hour}
                </text>
              </g>
            );
          })}
          
          <text
            x={margin.left - 50}
            y={chartHeight / 2}
            textAnchor="middle"
            className="text-sm fill-gray-600 font-medium"
            transform={`rotate(-90, ${margin.left - 50}, ${chartHeight / 2})`}
          >
            Cumulative Production (Units)
          </text>
          
          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            className="text-sm fill-gray-600 font-medium"
          >
            Hour of Day
          </text>
          
          {productionData.length > 1 && (
            <defs>
              <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={variance > 0 ? "#10B981" : "#EF4444"} stopOpacity="0.1"/>
                <stop offset="100%" stopColor={variance > 0 ? "#10B981" : "#EF4444"} stopOpacity="0.05"/>
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              status === 'ahead' ? 'bg-green-100' : 
              status === 'behind' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {getStatusIcon(status)}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Production Status: <span className={`${
                  status === 'ahead' ? 'text-green-600' : 
                  status === 'behind' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {status === 'ahead' ? 'Ahead of Schedule' : 
                   status === 'behind' ? 'Behind Schedule' : 'On Track'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                {currentData ? `Last hour: ${currentData.actualHourly} units produced` : 'Waiting for data...'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Simulation Speed</p>
            <p className="text-lg font-bold text-gray-900">10s = 1hr</p>
            <div className={`w-3 h-3 rounded-full mx-auto mt-1 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionChart;