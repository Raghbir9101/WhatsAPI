"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const assignedPackagesSchema = new mongoose_1.default.Schema({
    package: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Package',
    },
    lastDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });
//pre hook to set the lastDate by returning by finding the package(populated) duration
// assignedPackagesSchema.pre('save', async function(next){
//     if(this.isNew){
//         const foundPackage = await Package.findById(this.packageId).select('validityDays');
//         this.lastDate = new Date(Date.now() + foundPackage.validityDays * 24 * 60 * 60 * 1000);
//     }
//     next();
// });
const AssignedPackages = mongoose_1.default.model('assignedPackage', assignedPackagesSchema);
exports.default = AssignedPackages;
