import Shipment from "../models/Shipment.model.js";
import { getIO } from "../config/socket.js";
import { crudController } from "./crud.controller.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const shipmentCrud = crudController(Shipment, "Shipment");

export async function updateShipmentStatus(req, res, next) {
  try {
    const shipment = await Shipment.findById(req.params.id);
    shipment.status = req.body.status;
    shipment.statusHistory.push({ status: req.body.status, note: req.body.note, timestamp: new Date(), updatedBy: req.user._id });
    await shipment.save();
    getIO().emit("shipment:status", shipment);
    sendSuccess(res, shipment, "Shipment status updated");
  } catch (error) {
    next(error);
  }
}

export async function trackShipment(req, res, next) {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNo });
    sendSuccess(res, shipment, "Tracking details");
  } catch (error) {
    next(error);
  }
}

