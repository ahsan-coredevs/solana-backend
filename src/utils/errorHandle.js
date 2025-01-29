// Error handler for API responses
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
  
    // Default error status and message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
  
    res.status(statusCode).json({
      success: false,
      message: message,
      error: err.stack
    });
  };
  
  module.exports = errorHandler;
  