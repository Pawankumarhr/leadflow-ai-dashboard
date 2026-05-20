import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';

const validate = (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
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

export default validate;
