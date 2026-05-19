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

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({
        message: 'Groq API key is not configured. Please add your key to the .env file.'
      });
    }

    // Fetch database summaries
    const warehouses = await Warehouse.find().select('name locationName capacity currentUsage');
    const drivers = await Driver.find().select('name status vehicleNumber');
    const shipments = await Shipment.find({ status: { $ne: 'DELIVERED' } }).select('source destination status priority');

    const warehouseContext = warehouses.map(w => `${w.name} (Capacity: ${w.capacity}, Usage: ${w.currentUsage})`).join(', ');
    const driverContext = drivers.map(d => `${d.name} (${d.status})`).join(', ');
    const shipmentContext = `Active Shipments: ${shipments.length}`;

    const dbContext = `Database Context:
    - Warehouses (${warehouses.length}): ${warehouseContext || 'None'}
    - Drivers (${drivers.length}): ${driverContext || 'None'}
    - ${shipmentContext}
    `;

    const systemPrompt = `You are LogiFlow AI, a specialized logistics and supply chain assistant. 
    Answer the user's question accurately and professionally using the following live database context if relevant.
    
    ${dbContext}
    
    Keep your answers short, concise, and highly relevant. Do not provide long explanations unless asked. Format your response cleanly.`;

    const url = `https://api.groq.com/openai/v1/chat/completions`;

    const response = await axios.post(url, {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    });

    const reply = response.data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('Invalid response format from Groq API');
    }

    res.status(200).json({
      reply: reply
    });
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to communicate with AI. Please check your Groq API key and network connection.',
      error: error.message
    });
  }
};
