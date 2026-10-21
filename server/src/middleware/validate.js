import { AppError } from './errorHandler.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues.map((i) => i.message).join('; ');
      throw new AppError(msg, 422);
    }
    req.validated = result.data;
    next();
  };
}
