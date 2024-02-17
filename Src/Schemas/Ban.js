const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const banSchema = new Schema (
    {
        userId: { type: Number, required: true },
        reason: { type: String, required: true },
        duration: { type: Number, required: true },
        expires: { type: String, required: true }
    },

    { timestamps: true }
);

module.exports = mongoose.models["Keys"] || mongoose.model("Keys", banSchema);