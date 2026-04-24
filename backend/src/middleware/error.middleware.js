function notFound(request, response, next) {
  const error = new Error(`Route not found: ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;

  response.status(statusCode).json({
    message: error.message || 'Internal server error.',
    details: error.details || null,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
