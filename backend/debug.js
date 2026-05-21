const mongoose = require('mongoose');
const Shipment = require('./src/models/Shipment');
const Warehouse = require('./src/models/Warehouse');
const Driver = require('./src/models/Driver');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const driver = await Driver.findOne();
    const sourceW = await Warehouse.findOne();
    const destW = await Warehouse.findOne({ _id: { $ne: sourceW._id } });
    
    console.log('Driver:', driver._id);
    console.log('Source:', sourceW.name);
    console.log('Dest:', destW.name);
    
    const req = {
      body: {
        source: sourceW.name,
        destination: destW.name,
        weight: 100,
        priority: 'Normal',
        driverId: driver._id
      }
    };
    
    const res = {
      status: (code) => ({
        json: (data) => console.log('STATUS:', code, 'DATA:', data)
      })
    };
    
    const controller = require('./src/controllers/shipmentController');
    await controller.createShipment(req, res);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
});
