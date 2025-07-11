const { v4: uuidv4 } = require('uuid');

// Generate unique identifiers
const generateApiKey = () => {
  return 'wa_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const generateInstanceId = () => {
  return 'inst_' + uuidv4().replace(/-/g, '');
};

// Phone number formatter
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    return '91' + cleaned + '@c.us';
  }
  return cleaned + '@c.us';
};

// Create required directories
const createRequiredDirectories = (fs) => {
  const dirs = ['sessions', 'uploads', 'public', 'logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

module.exports = {
  generateApiKey,
  generateInstanceId,
  formatPhoneNumber,
  createRequiredDirectories
}; 