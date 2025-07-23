export const machines = [
  {
    id: 'M001',
    name: 'CNC Mill #1',
    status: 'running',
    efficiency: 87.234,
    production: 145.678,
    temperature: 75.5,
    pressure: 120.3,
    tempThreshold: 82.300,
    pressureThreshold: 150,
    lastUpdate: new Date(),
  },
  {
    id: 'M002',
    name: 'Lathe #2',
    status: 'running',
    efficiency: 92.156,
    production: 120.432,
    temperature: 68.2,
    pressure: 95.7,
    tempThreshold: 80,
    pressureThreshold: 140,
    lastUpdate: new Date(),
  },
  {
    id: 'M003',
    name: 'Press #1',
    status: 'maintenance',
    efficiency: 0.000,
    production: 0.000,
    temperature: 45.1,
    pressure: 30.2,
    tempThreshold: 90,
    pressureThreshold: 160,
    lastUpdate: new Date(),
  },
  {
    id: 'M004',
    name: 'Grinder #3',
    status: 'idle',
    efficiency: 45.789,
    production: 80.123,
    temperature: 52.8,
    pressure: 65.4,
    tempThreshold: 75,
    pressureThreshold: 130,
    lastUpdate: new Date(),
  },
  {
    id: 'M005',
    name: 'Welder #2',
    status: 'running',
    efficiency: 95.321,
    production: 200.567,
    temperature: 82.3,
    pressure: 110.8,
    tempThreshold: 95,
    pressureThreshold: 145,
    lastUpdate: new Date(),
  },
];

export const generateProductionData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    machines.forEach(machine => {
      // More realistic production simulation with time-based patterns
      const hourOfDay = 24 - i;
      const baseProduction = machine.status === 'running' ? machine.production : 
                           machine.status === 'maintenance' ? 0 : 
                           machine.production * 0.3;
      
      // Add time-based production patterns (higher during peak hours)
      const timeMultiplier = hourOfDay >= 8 && hourOfDay <= 18 ? 1.2 : 0.8;
      const variance = (Math.random() * 0.4 - 0.2) * baseProduction; // ±20% variance
      const production = Math.max(0, baseProduction * timeMultiplier + variance);
      
      const efficiency = machine.status === 'running' ? 
        Math.min(100, Math.max(0, machine.efficiency + Math.random() * 20 - 10)) : 
        machine.status === 'maintenance' ? 0 : Math.random() * 30;
      
      data.push({
        time: timeString,
        machineId: machine.id,
        production: Math.round(production),
        efficiency: Math.round(efficiency),
      });
    });
  }
  
  return data;
};

export const generateLogs = () => {
  const logs = [];
  const now = new Date();
  
  const logMessages = [
    { type: 'start', message: 'Production cycle started', details: 'Automatic startup sequence completed' },
    { type: 'stop', message: 'Production cycle stopped', details: 'Planned maintenance window' },
    { type: 'maintenance', message: 'Scheduled maintenance', details: 'Oil change and calibration check' },
    { type: 'error', message: 'Temperature threshold exceeded', details: 'Cooling system malfunction detected' },
    { type: 'warning', message: 'Efficiency below target', details: 'Current efficiency: 72%, Target: 85%' },
    { type: 'info', message: 'Production target achieved', details: 'Daily quota reached ahead of schedule' },
  ];

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000);
    const machine = machines[Math.floor(Math.random() * machines.length)];
    const logType = logMessages[Math.floor(Math.random() * logMessages.length)];
    
    logs.push({
      id: `log-${i}`,
      timestamp,
      machineId: machine.id,
      type: logType.type,
      message: `${machine.name}: ${logType.message}`,
      details: logType.details,
    });
  }
  
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};