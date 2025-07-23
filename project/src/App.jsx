import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header.jsx';
import MachineCard from './components/MachineCard.jsx';
import MachineDetailModal from './components/MachineDetailModal.jsx';
import ProductionChart from './components/ProductionChart.jsx';
import LogsPanel from './components/LogsPanel.jsx';

function App() {
  const [machineData, setMachineData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedMachineDetail, setSelectedMachineDetail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fetch machine data from backend
    const fetchMachineData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/machines');
        // Filter out invalid or duplicate machines
        const validMachines = Array.from(
          new Map(response.data
            .filter(machine => machine && machine.id && machine.name && machine.status)
            .map(machine => [machine.id, machine])
          ).values()
        );
        if (validMachines.length !== response.data.length) {
          console.warn('Filtered out invalid machine data:', response.data.filter(m => !m || !m.id || !m.name || !m.status));
        }
        setMachineData(validMachines);
      } catch (error) {
        console.error('Error fetching machine data:', error.message);
      }
    };

    // Fetch logs from backend
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching logs:', error.message);
      }
    };

    // Initial data fetch
    fetchMachineData();
    fetchLogs();

    // Real-time updates every 5 seconds
    const interval = setInterval(() => {
      fetchMachineData();
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleMachineClick = (machine) => {
    setSelectedMachineDetail(machine);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMachineDetail(null);
  };

  const totalMachines = machineData.length;
  const runningMachines = machineData.filter(m => m.status === 'running').length;
  const totalProduction = machineData.reduce((sum, m) => sum + (m.production || 0), 0).toFixed(3);
  const averageEfficiency = machineData.length > 0 
    ? (machineData.reduce((sum, m) => sum + (m.efficiency || 0), 0) / machineData.length).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          totalMachines={totalMachines}
          runningMachines={runningMachines}
          totalProduction={totalProduction}
          averageEfficiency={averageEfficiency}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ProductionChart selectedMachine={selectedMachine ? machineData.find(m => m.id === selectedMachine) : null} />
          </div>
          <div>
            <LogsPanel logs={logs} />
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Machine Status</h2>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Machines</option>
              {machineData.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.id})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {machineData.map(machine => (
              <MachineCard 
                key={machine.id} 
                machine={machine} 
                onMachineClick={handleMachineClick}
              />
            ))}
          </div>
        </div>
        
        <MachineDetailModal
          machine={selectedMachineDetail}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}

export default App;