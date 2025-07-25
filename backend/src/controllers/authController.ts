import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { generateApiKey } from '../utils/helpers';
import AssignedPackages from '../models/assignedPackages';

// User registration
const register = async (req, res) => {
  const { email, password, name, company } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = generateApiKey();

    
    const user = new User({
      email,
      name,
      company: company || '',
      password: hashedPassword,
      apiKey
    });
    
    const newAssignedPackage = new AssignedPackages({
      packageId: "6870f43c564218b06c96fff2",
      userId: user._id
    });
    await user.save();
    await newAssignedPackage.save();
    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      apiKey: user.apiKey,
      email: user.email,
      name: user.name,
      company: user.company,
      assignedPackages:newAssignedPackage
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// User login
const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email, isActive: true }).populate('assignedPackages.package');

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      apiKey: user.apiKey,
      userId: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      package:user.assignedPackages
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export {
  register,
  login
}; 