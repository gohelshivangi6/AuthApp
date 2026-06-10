/**
 * Express error-handling middleware.
 * Catches all errors thrown in routes, preventing Node server crashes.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler] Unhandled error encountered:');
  console.error(err);

  // If headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Set response status code (default to 500)
  const statusCode = err.status || 500;
  
  // Return structured JSON response. Hide detailed stack traces in production
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 
      ? 'A server error occurred. Our engineers have been notified.' 
      : err.message || 'An unexpected error occurred.',
    // Only return error details in non-production environments if needed
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
