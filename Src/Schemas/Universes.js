const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // console.log("Universe handler connected");
});

const universeSchema = new Schema({
    universeId: String,
    name: String
}, { typeKey: '$type', strict: false });

// addUniverse method
universeSchema.statics.addUniverse = async function (universeName, universeId) {
    try {
        const universe = new this({ name: universeName, universeId: universeId });
        const result = await universe.save();
        return result;
    } catch (err) {
        throw err;
    };
};

// removeUniverse method
universeSchema.statics.removeUniverse = async function (universeName) {
    try {
        const result = await this.deleteOne({ name: universeName });
        if (!result.deletedCount || result.deletedCount === 0) return false;
        return true;
    } catch (err) {
        throw err;
    };
};

// getUniverse method
universeSchema.statics.getUniverse = async function (universeName) {
    try {
        const universe = await this.findOne({ name: universeName });
        if (!universe) {
            return false;
        };
        return universe;
    } catch (err) {
        throw err;
    };
};

// listUniverses method
universeSchema.statics.listUniverses = async function () {
    try {
        const universes = await this.find({});
        if (!universes) {
            console.log('none');
            return [];
        }
        return universes.map(universe => ({ name: universe.name, id: universe.universeId }));
    } catch (err) {
        console.log('threw');
        throw err;
    };
};

module.exports = mongoose.models["Universes"] || mongoose.model("Universes", universeSchema);