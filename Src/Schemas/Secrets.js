const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privateSchema = new Schema(
    {
        messagingServiceKey: { type: String, required: true },
        datastoreServiceKey: { type: String, required: true },
        mongoDbUrl: { type: String, required: true },
        guildId: { type: Number, required: true }
    },

    { timestamps: true }
)

privateSchema.statics.getKey = async function (keyName, guildId) { 
    try {
        const record = await this.findOne({ guildId: guildId });
        if (!record) return false;
        return record[keyName];
    } catch (err) {console.error(err)};
};

module.exports = mongoose.models["PrivateKeys"] || mongoose.model("PrivateKeys", privateSchema);