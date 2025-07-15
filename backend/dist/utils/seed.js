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
exports.seedAdminUser = exports.seedPackages = exports.runSeed = void 0;
const models_1 = require("../models");
const bcrypt_1 = __importDefault(require("bcrypt"));
const helpers_1 = require("./helpers");
// Seed default packages
const seedPackages = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingPackages = yield models_1.Package.countDocuments();
        if (existingPackages === 0) {
            const defaultPackages = [
                {
                    name: 'BASIC',
                    credits: 5000,
                    price: 99,
                    validityDays: 30,
                    features: ['5,000 messages', '1 WhatsApp number', 'Basic support'],
                    isActive: true
                },
                {
                    name: 'PREMIUM',
                    credits: 15000,
                    price: 199,
                    validityDays: 30,
                    features: ['15,000 messages', '5 WhatsApp numbers', 'Priority support', 'Analytics'],
                    isActive: true
                },
                {
                    name: 'ENTERPRISE',
                    credits: 50000,
                    price: 499,
                    validityDays: 30,
                    features: ['50,000 messages', 'Unlimited WhatsApp numbers', '24/7 support', 'Advanced analytics', 'API access'],
                    isActive: true
                }
            ];
            yield models_1.Package.insertMany(defaultPackages);
            console.log('✅ Default packages seeded successfully');
        }
        else {
            console.log('📦 Packages already exist, skipping seed');
        }
    }
    catch (error) {
        console.error('❌ Error seeding packages:', error);
    }
});
exports.seedPackages = seedPackages;
// Seed admin user
const seedAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingAdmin = yield models_1.User.findOne({ role: 'ADMIN' });
        if (!existingAdmin) {
            const hashedPassword = yield bcrypt_1.default.hash('admin123', 10);
            const apiKey = (0, helpers_1.generateApiKey)();
            const adminUser = new models_1.User({
                email: 'admin@ceoitbox.com',
                name: 'Admin User',
                company: 'CEOITBOX',
                password: hashedPassword,
                apiKey,
                role: 'ADMIN',
                packageType: 'ENTERPRISE',
                creditsTotal: 100000,
                creditsUsed: 0,
                validityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                status: 'ACTIVE'
            });
            yield adminUser.save();
            console.log('✅ Admin user created successfully');
            console.log('📧 Admin email: admin@ceoitbox.com');
            console.log('🔑 Admin password: admin123');
            console.log('🚨 Please change the admin password after first login!');
        }
        else {
            console.log('👤 Admin user already exists, skipping seed');
        }
    }
    catch (error) {
        console.error('❌ Error seeding admin user:', error);
    }
});
exports.seedAdminUser = seedAdminUser;
// Main seed function
const runSeed = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🌱 Starting database seeding...');
    yield seedPackages();
    yield seedAdminUser();
    console.log('🎉 Database seeding completed!');
});
exports.runSeed = runSeed;
