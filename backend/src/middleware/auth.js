const User = require('../models/User');

// Middleware to verify API key
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  try {
    const user = await User.findOne({ apiKey, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { verifyApiKey }; 