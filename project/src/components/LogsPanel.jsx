import React from 'react';
import { AlertCircle, Info, AlertTriangle, Play, Square } from 'lucide-react';

const LogsPanel = ({ logs }) => {
  const getIconForType = (type) => {
    switch (type.toLowerCase()) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'start':
        return <Play className="w-5 h-5 text-green-500" />;
      case 'stop':
        return <Square className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Logs</h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs available</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-start space-x-3 border-b pb-2">
              <div>{getIconForType(log.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {log.message} ({log.machineId})
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">{log.details}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogsPanel;