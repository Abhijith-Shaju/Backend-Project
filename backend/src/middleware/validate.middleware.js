import AppError from "../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new AppError(error.details.map((detail) => detail.message).join(", "), 400));
    }
    req.body = value;
    next();
  };
}

