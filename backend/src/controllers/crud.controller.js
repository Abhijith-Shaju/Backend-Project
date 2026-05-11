import { sendSuccess } from "../utils/apiResponse.js";

export function crudController(Model, label, options = {}) {
  return {
    list: async (req, res, next) => {
      try {
        const filter = options.filter ? options.filter(req) : {};
        const data = await Model.find(filter).sort({ createdAt: -1 }).limit(Number(req.query.limit) || 100);
        sendSuccess(res, data, `${label} list`);
      } catch (error) {
        next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        const payload = options.beforeCreate ? options.beforeCreate(req.body, req) : req.body;
        const data = await Model.create(payload);
        sendSuccess(res, data, `${label} created`, 201);
      } catch (error) {
        next(error);
      }
    },
    get: async (req, res, next) => {
      try {
        const data = await Model.findById(req.params.id);
        sendSuccess(res, data, `${label} details`);
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const data = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        sendSuccess(res, data, `${label} updated`);
      } catch (error) {
        next(error);
      }
    },
    remove: async (req, res, next) => {
      try {
        const data = await Model.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        sendSuccess(res, data, `${label} deactivated`);
      } catch (error) {
        next(error);
      }
    }
  };
}

