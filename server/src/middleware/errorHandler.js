// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: err.message || 'Internal server error',
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
