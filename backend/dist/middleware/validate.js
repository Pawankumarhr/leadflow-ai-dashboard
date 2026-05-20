"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            message: 'Validation error',
            details: error.details.map((detail) => detail.message),
        });
    }
    req.body = value;
    return next();
};
exports.default = validate;
