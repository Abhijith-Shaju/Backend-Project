import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Shipment from "../models/Shipment.model.js";
import Vehicle from "../models/Vehicle.model.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function dashboard(req, res, next) {
  try {
    const [shipments, delivered, products, vehicles, revenue] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: "delivered" }),
      Product.countDocuments({ isActive: true }),
      Vehicle.countDocuments({ isAvailable: true }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }])
    ]);

    sendSuccess(res, {
      shipments,
      delivered,
      products,
      activeVehicles: vehicles,
      revenue: revenue[0]?.total || 0,
      onTimeRate: shipments ? Math.round((delivered / shipments) * 100) : 0
    }, "Dashboard metrics");
  } catch (error) {
    next(error);
  }
}

