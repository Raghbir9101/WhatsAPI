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
exports.migrateMessagesSource = migrateMessagesSource;
const models_1 = require("../models");
function migrateMessagesSource() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting message source migration...');
            // Update all messages without a source field to have 'frontend' as default
            const result = yield models_1.Message.updateMany({ source: { $exists: false } }, { $set: { source: 'frontend' } });
            console.log(`Migration completed: Updated ${result.modifiedCount} messages with default source 'frontend'`);
            return result;
        }
        catch (error) {
            console.error('Error during message migration:', error);
            throw error;
        }
    });
}
