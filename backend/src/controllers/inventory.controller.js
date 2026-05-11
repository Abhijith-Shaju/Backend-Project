import Product from "../models/Product.model.js";
import { getIO } from "../config/socket.js";
import { crudController } from "./crud.controller.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const productCrud = crudController(Product, "Product");

export async function adjustStock(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    product.stockQty += Number(req.body.quantity);
    product.stockHistory.push({ ...req.body, createdBy: req.user._id, createdAt: new Date() });
    await product.save();

    if (product.stockQty <= product.reorderPoint) {
      getIO().to("warehouse_manager").emit("inventory:lowStock", product);
    }

    sendSuccess(res, product, "Stock adjusted");
  } catch (error) {
    next(error);
  }
}

export async function lowStock(req, res, next) {
  try {
    const products = await Product.find({ $expr: { $lte: ["$stockQty", "$reorderPoint"] } });
    sendSuccess(res, products, "Low stock products");
  } catch (error) {
    next(error);
  }
}

