const axios = require('axios');
const Warehouse = require('../models/Warehouse');
const Driver = require('../models/Driver');
const Shipment = require('../models/Shipment');

exports.chatWithAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Fetch database summaries
    const warehouses = await Warehouse.find().select('name locationName capacity currentUsage');
    const drivers = await Driver.find().select('name status vehicleNumber');
    const shipments = await Shipment.find({ status: { $ne: 'DELIVERED' } }).select('source destination status priority');

    const warehouseContext = warehouses.map(w => `${w.name} (Capacity: ${w.capacity})`).join(', ');
    const driverContext = drivers.map(d => `${d.name} (${d.status})`).join(', ');
    const shipmentContext = `Active Shipments: ${shipments.length}`;

    const dbContext = `Database Context:
    - Warehouses (${warehouses.length}): ${warehouseContext || 'None'}
    - Drivers (${drivers.length}): ${driverContext || 'None'}
    - ${shipmentContext}
    `;

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2:1b';

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: model,
      prompt: `You are LogiFlow AI, a specialized logistics and supply chain assistant. 
      Answer the user's question accurately and professionally using the following database context if relevant.
      
      ${dbContext}
      
      Keep your answers short, concise, and highly relevant. Do not provide long explanations unless asked.
      User Question: ${prompt}`,
      stream: false
    });

    res.status(200).json({
      reply: response.data.response
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Ollama Model Not Found:', process.env.OLLAMA_MODEL);
      return res.status(404).json({
        message: `Model "${process.env.OLLAMA_MODEL}" not found in Ollama. Please run "ollama list" to check your model name and update your .env file.`,
        error: error.message
      });
    }

    console.error('Ollama API Error:', error.message);
    res.status(500).json({
      message: 'Failed to communicate with local AI (Ollama). Make sure it is running.',
      error: error.message
    });
  }
};
