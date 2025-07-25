import mongoose from "mongoose";
import Package from "./Package";

const assignedPackagesSchema = new mongoose.Schema({
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
    },
    lastDate:{
        type:Date,
        default:null
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

const AssignedPackages = mongoose.model('assignedPackage', assignedPackagesSchema);

export default AssignedPackages;