#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const seed_1 = require("../utils/seed");
// Run seed script
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔌 Connecting to database...');
        yield (0, database_1.connectDB)();
        yield (0, seed_1.runSeed)();
        console.log('✅ Seed script completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seed script failed:', error);
        process.exit(1);
    }
});
main();
