"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
const assignedPackages_1 = __importDefault(require("../models/assignedPackages"));
// User registration
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, company } = req.body;
    try {
        // Check if user already exists
        const existingUser = yield models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const apiKey = (0, helpers_1.generateApiKey)();
        const user = new models_1.User({
            email,
            name,
            company: company || '',
            password: hashedPassword,
            apiKey
        });
        const newAssignedPackage = new assignedPackages_1.default({
            packageId: "6870f43c564218b06c96fff2",
            userId: user._id
        });
        yield user.save();
        yield newAssignedPackage.save();
        res.status(201).json({
            message: 'User registered successfully',
            userId: user._id,
            apiKey: user.apiKey,
            email: user.email,
            name: user.name,
            company: user.company,
            assignedPackages: newAssignedPackage
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
exports.register = register;
// User login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield models_1.User.findOne({ email, isActive: true }).populate('assignedPackages.package');
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ email: user.email, userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.json({
            token,
            apiKey: user.apiKey,
            userId: user._id,
            email: user.email,
            name: user.name,
            company: user.company,
            package: user.assignedPackages
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.login = login;
