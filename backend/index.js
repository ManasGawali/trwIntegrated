const express = require("express");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
require("dotenv").config();
const twilio = require("twilio");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173"
}));

// InfluxDB configuration
// const influxDB = new InfluxDB({
//   url: process.env.INFLUXDB_URL || "http://localhost:8086",
//   token: process.env.INFLUXDB_TOKEN
// });
//const { InfluxDB } = require('@influxdata/influxdb-client');

// InfluxDB credentials (you can replace with env vars if needed)
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const token = '-cH8SXz9UqNIMUumCLTgVEGlVd_3Cx-p0EyI1QPiLSnvY2kzItWJhKc2A_2QZl2Xjtz9I2JrWbh3w-yGN5024A==';
const org = 'PICT';
const bucket = 'production_monitoring';

// Initialize Influx client first
const influxDB = new InfluxDB({ url, token });

// Then get write and query APIs
const writeApi = influxDB.getWriteApi(org, bucket, "ms"); // "ms" = millisecond precision
const queryApi = influxDB.getQueryApi(org);

// Twilio configuration
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// // Simulated machine data generation
// const generateMachineData = () => {
//   const machines = [
//     {
//       id: "M001",
//       name: "CNC Mill #1",
//       status: "running",
//       tempThreshold: 82.3,
//       pressureThreshold: 150
//     },
//     {
//       id: "M002",
//       name: "Lathe #2",
//       status: "running",
//       tempThreshold: 80,
//       pressureThreshold: 140
//     },
//     {
//       id: "M003",
//       name: "Press #1",
//       status: "maintenance",
//       tempThreshold: 90,
//       pressureThreshold: 160
//     },
//     {
//       id: "M004",
//       name: "Grinder #3",
//       status: "idle",
//       tempThreshold: 75,
//       pressureThreshold: 130
//     },
//     {
//       id: "M005",
//       name: "Welder #2",
//       status: "running",
//       tempThreshold: 95,
//       pressureThreshold: 145
//     }
//   ];

//   return machines.map(machine => {
//     const efficiency = machine.status === "running" ? 80 + Math.random() * 20 : 
//                       machine.status === "maintenance" ? 0 : Math.random() * 30;
//     const baseProduction = machine.status === "running" ? 100 : 
//                          machine.status === "maintenance" ? 0 : 30;
//     const timeMultiplier = new Date().getHours() >= 8 && new Date().getHours() <= 18 ? 1.2 : 0.8;
//     const production = Math.max(0, baseProduction * timeMultiplier + (Math.random() * 0.4 - 0.2) * baseProduction);
    
//     return {
//       ...machine,
//       efficiency: Number(efficiency.toFixed(3)),
//       production: Number(production.toFixed(3)),
//       temperature: Number((machine.status === "running" ? 60 + Math.random() * 25 : 40 + Math.random() * 15).toFixed(3)),
//       pressure: Number((machine.status === "running" ? 80 + Math.random() * 50 : 20 + Math.random() * 30).toFixed(3)),
//       lastUpdate: new Date()
//     };
//   });
// };

// // Write machine data to InfluxDB
// const writeMachineData = async () => {
//   try {
//     const machines = generateMachineData();
//     console.log("Generated machine data:", JSON.stringify(machines, null, 2)); // Debug: Log all generated data

//     const points = machines.map(machine => {
//       const point = new Point("machine_metrics")
//         .tag("machineId", machine.id)
//         .tag("machineName", machine.name)
//         .tag("status", machine.status)
//         .floatField("efficiency", machine.efficiency)
//         .floatField("production", machine.production)
//         .floatField("temperature", machine.temperature)
//         .floatField("pressure", machine.pressure)
//         .floatField("tempThreshold", machine.tempThreshold)
//         .floatField("pressureThreshold", machine.pressureThreshold)
//         .timestamp(new Date());
//       console.log(`Generated point for ${machine.id}: ${point.toString()}`); // Debug: Log each point
//       return point;
//     });

//     for (const point of points) {
//       try {
//         await writeApi.writePoint(point);
//         console.log(`Successfully wrote point for ${point.tags.machineId}`);
//       } catch (error) {
//         console.error(`Failed to write point for ${point.tags.machineId}:`, error.message);
//         if (error.statusCode) {
//           console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//         }
//       }
//     }
//     await writeApi.flush();
//     console.log("Machine data write attempt completed");
//   } catch (error) {
//     console.error("Error writing to InfluxDB:", error.message);
//     if (error.statusCode) {
//       console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//       if (error.statusCode === 429) {
//         console.warn("InfluxDB free tier write limit reached. Consider upgrading or increasing write interval.");
//       } else if (error.statusCode === 401) {
//         console.warn("Invalid InfluxDB token. Check INFLUXDB_TOKEN in .env.");
//       } else if (error.statusCode === 403) {
//         console.warn("Permission denied. Verify bucket access for INFLUXDB_TOKEN.");
//       }
//     }
//   }
// };

// // Write logs to InfluxDB
// const writeLogs = async () => {
//   try {
//     const machines = generateMachineData();
//     if (Math.random() < 0.3) {
//       const machine = machines[Math.floor(Math.random() * machines.length)];
//       const logTypes = ['info', 'warning', 'start', 'stop'];
//       const messages = {
//         info: 'System update',
//         warning: 'Efficiency below target',
//         start: 'Production cycle started',
//         stop: 'Production cycle stopped'
//       };
//       const details = {
//         info: 'Automated status update',
//         warning: 'Check machine performance',
//         start: 'Automatic startup sequence completed',
//         stop: 'Planned maintenance window'
//       };
//       const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
//       const point = new Point("machine_logs")
//         .tag("machineId", machine.id)
//         .tag("machineName", machine.name)
//         .tag("type", logType)
//         .stringField("message", messages[logType])
//         .stringField("details", details[logType])
//         .timestamp(new Date());
//       console.log(`Writing log for ${machine.id}: ${point.toString()}`);
//       await writeApi.writePoint(point);
//       await writeApi.flush();
//       console.log(`Log written to InfluxDB for ${machine.id}`);
//     }
//   } catch (error) {
//     console.error("Error writing log to InfluxDB:", error.message);
//     if (error.statusCode) {
//       console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//       if (error.statusCode === 429) {
//         console.warn("InfluxDB free tier write limit reached.");
//       }
//     }
//   }
// };

// Generate and write data every 30 seconds to avoid free tier limits
// setInterval(async () => {
//   await writeMachineData();
//   await writeLogs();
// }, 30000);

// API to get all machines' current data (InfluxQL)
// app.get("/api/machines", async (req, res) => {
//   const query = `
//     SELECT LAST(efficiency) AS efficiency, LAST(production) AS production, LAST(temperature) AS temperature,
//            LAST(pressure) AS pressure, LAST(tempThreshold) AS tempThreshold, LAST(pressureThreshold) AS pressureThreshold,
//            machineName, status
//     FROM machine_metrics
//     WHERE time > now() - 3600s
//     GROUP BY "machineId"
//   `;
  
//   try {
//     const machines = [];
//     for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
//       const o = tableMeta.toObject(values);
//       const machine = {
//         id: o.machineId || "Unknown",
//         name: o.machineName || "Unknown Machine",
//         status: o.status || "unknown",
//         efficiency: o.efficiency || 0,
//         production: o.production || 0,
//         temperature: o.temperature || 0,
//         pressure: o.pressure || 0,
//         tempThreshold: o.tempThreshold || 0,
//         pressureThreshold: o.pressureThreshold || 0,
//         lastUpdate: new Date(o.time || Date.now())
//       };
//       console.log(`Fetched machine data for ${machine.id}:`, machine);
//       machines.push(machine);
//     }
//     if (machines.length === 0) {
//       console.warn("No machine data found in InfluxDB. Bucket may be empty.");
//       // Fallback: Return generated data if bucket is empty
//       const fallbackData = generateMachineData();
//       console.log("Returning fallback data:", fallbackData);
//       return res.json(fallbackData);
//     }
//     res.json(machines);
//   } catch (error) {
//     console.error("Error querying machines:", error.message);
//     if (error.statusCode) {
//       console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//     }
//     // Fallback for query errors
//     const fallbackData = generateMachineData();
//     console.log("Query failed, returning fallback data:", fallbackData);
//     res.json(fallbackData);
//   }
// });
app.get("/api/machine", async (req, res) => {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "PU")
      |> filter(fn: (r) => r._field == "temperature" or r._field == "humidity")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> limit(n: 10)
  `;

  try {
    const results = [];

    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
      const row = tableMeta.toObject(values);
      results.push({
        temperature: parseFloat(row.temperature) || 0,
        humidity: parseFloat(row.humidity) || 0,
        time: row._time ? new Date(row._time) : new Date(),
        source: "influxdb"
      });
    }

    if (results.length === 0) {
      console.warn("No data found in InfluxDB");
      return res.json({
        data: generateFallbackData(),
        count: 1,
        source: "fallback"
      });
    }

    console.log(`Successfully fetched ${results.length} records`);
    res.json({
      data: results,
      count: results.length,
      source: "influxdb"
    });

  } catch (error) {
    console.error("Query Error:", {
      message: error.message,
      status: error.statusCode,
      body: error.body
    });

    const fallbackData = generateFallbackData();
    res.json({
      data: fallbackData,
      count: fallbackData.length,
      source: "fallback",
      error: "Failed to fetch from InfluxDB"
    });
  }
});

function generateFallbackData() {
  return Array(10).fill().map((_, i) => ({
    temperature: 25 + Math.random() * 5,
    humidity: 50 + Math.random() * 10,
    time: new Date(Date.now() - i * 60000),
    source: "fallback"
  }));
}
function generateFallbackData() {
  // Generate 10 sample records
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push({
      temperature: Math.random() * 30 + 20, // Random temp between 20-50
      humidity: Math.random() * 50 + 30,    // Random humidity between 30-80
      time: new Date(Date.now() - i * 60000), // Timestamps spaced 1 minute apart
      source: "fallback"
    });
  }
  return data;
}

// API to get historical data for a specific machine (Flux query)
// app.get("/api/machine/:id/history", async (req, res) => {
//   const { id } = req.params;
//   const query = `
//     from(bucket: "${process.env.INFLUXDB_BUCKET}")
//       |> range(start: -30m)
//       |> filter(fn: (r) => r._measurement == "machine_metrics" and r.machineId == "${id}")
//       |> filter(fn: (r) => r._field == "temperature" or r._field == "pressure" or r._field == "tempThreshold" or r._field == "pressureThreshold")
//       |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
//   `;
  
//   try {
//     const temperatureData = [];
//     const pressureData = [];
//     for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
//       const o = tableMeta.toObject(values);
//       temperatureData.push({
//         timestamp: new Date(o._time).getTime(),
//         value: o.temperature || 0,
//         threshold: o.tempThreshold || 0
//       });
//       pressureData.push({
//         timestamp: new Date(o._time).getTime(),
//         value: o.pressure || 0,
//         threshold: o.pressureThreshold || 0
//       });
//     }
//     if (temperatureData.length === 0 && pressureData.length === 0) {
//       console.warn(`No historical data found for machine ${id}`);
//       return res.status(404).json({ error: `No historical data for machine ${id}` });
//     }
//     res.json({ temperatureData, pressureData });
//   } catch (error) {
//     console.error("Error querying machine history:", error.message);
//     if (error.statusCode) {
//       console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//     }
//     res.status(500).json({ error: "Failed to fetch machine history" });
//   }
// });

// API to get production data (Flux query)
// app.get("/api/production/:id", async (req, res) => {
//   const { id } = req.params;
//   const isAllMachines = id === "all";
//   const query = `
//     from(bucket: "${process.env.INFLUXDB_BUCKET}")
//       |> range(start: -24h)
//       |> filter(fn: (r) => r._measurement == "machine_metrics" and r._field == "production"${isAllMachines ? "" : ` and r.machineId == "${id}"`})
//       |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
//       |> yield(name: "mean")
//   `;
  
//   try {
//     const productionData = [];
//     let cumulative = 0;
//     const hourlyTarget = isAllMachines ? 12000 / 24 : 2400 / 24;
    
//     for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
//       const o = tableMeta.toObject(values);
//       const actualProduction = o._value || 0;
//       cumulative += actualProduction;
//       productionData.push({
//         hour: new Date(o._time).getHours(),
//         day: Math.floor((Date.now() - new Date(o._time).getTime()) / (1000 * 60 * 60 * 24)) + 1,
//         cumulative,
//         target: hourlyTarget * (new Date(o._time).getHours() + 1),
//         actualHourly: actualProduction,
//         timestamp: new Date(o._time)
//       });
//     }
    
//     if (productionData.length === 0) {
//       console.warn(`No production data found for ${isAllMachines ? "all machines" : `machine ${id}`}`);
//       return res.status(404).json({ error: "No production data available" });
//     }
    
//     res.json(productionData.slice(-24));
//   } catch (error) {
//     console.error("Error querying production data:", error.message);
//     if (error.statusCode) {
//       console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//     }
//     res.status(500).json({ error: "Failed to fetch production data" });
//   }
// });

// API to get logs (Flux query)
// app.get("/api/logs", async (req, res) => {
//   const query = `
//     from(bucket: "${process.env.INFLUXDB_BUCKET}")
//       |> range(start: -24h)
//       |> filter(fn: (r) => r._measurement == "machine_logs")
//       |> filter(fn: (r) => r._field == "message" or r._field == "details")
//       |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
//       |> sort(columns: ["_time"], desc: true)
//       |> limit(n: 25)
//   `;
  
//   try {
//     const logs = [];
//     for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
//       const o = tableMeta.toObject(values);
//       logs.push({
//         id: `log-${o._time}`,
//         timestamp: new Date(o._time),
//         machineId: o.machineId || "Unknown",
//         type: o.type || "info",
//         message: o.message || "No message",
//         details: o.details || "No details"
//       });
//     }
//     if (logs.length === 0) {
//       console.warn("No logs found in InfluxDB. Bucket may be empty.");
//       return res.json([]);
//     }
//     res.json(logs);
//   } catch (error) {
//     console.error("Error querying logs:", error.message);
//     if (error.statusCode) {
//       console.error(`HTTP Status: ${error.statusCode}, Message: ${error.body}`);
//     }
//     res.json([]);
//   }
// });

// Twilio alert endpoint
app.post("/api/send-alert", async (req, res) => {
  const { phone, message, sms, call } = req.body;

  try {
    let smsSid, callSid;
    if (sms) {
      const smsResponse = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      smsSid = smsResponse.sid;
    }

    if (call) {
      const callResponse = await client.calls.create({
        url: "http://demo.twilio.com/docs/voice.xml",
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER
      });
      callSid = callResponse.sid;
    }

    res.json({ success: true, smsSid, callSid });
  } catch (err) {
    console.error("Error sending alert:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const testPoint = new Point("health_check")
      .tag("test", "write")
      .floatField("value", 1)
      .timestamp(new Date());
    await writeApi.writePoint(testPoint);
    await writeApi.flush();
    res.json({ status: "ok", timestamp: new Date(), writeTest: "success" });
  } catch (error) {
    console.error("Health check write failed:", error.message);
    res.json({ status: "error", timestamp: new Date(), error: error.message });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});