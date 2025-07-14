// Global error handling middleware
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error.stack);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: error.message 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format',
      details: error.message 
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({ 
      error: 'Duplicate key error',
      details: 'Resource already exists' 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// 404 handler for API routes
const notFoundHandler = (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
};

export { errorHandler, notFoundHandler }; 