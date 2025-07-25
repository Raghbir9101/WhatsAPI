//model to track each api request, it'll be used to track the credit usage of the user
import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creditsUsed: {
        type: Number,
        default: 0
    },
    assignedPackage:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'assignedPackages',
        required:true
    }
}, { timestamps: true });

const Usage = mongoose.model('usage', usageSchema);

export default Usage;