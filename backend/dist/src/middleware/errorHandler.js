"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
// Global error handling middleware
const errorHandler = (error, _req, res, _next) => {
    console.error('Error:', error.stack);
    // Handle specific error types
    if (error.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation Error',
            details: error.message
        });
        return;
    }
    if (error.name === 'CastError') {
        res.status(400).json({
            error: 'Invalid ID format',
            details: error.message
        });
        return;
    }
    if (error.code === 11000) {
        res.status(400).json({
            error: 'Duplicate key error',
            details: 'Resource already exists'
        });
        return;
    }
    // Default error response
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
// 404 handler for API routes
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl
    });
};
exports.notFoundHandler = notFoundHandler;
