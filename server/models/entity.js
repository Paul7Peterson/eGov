const mongoose = require('mongoose');
const { Schema } = mongoose;

const ServiceSchema = new Schema ({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    section: { type: Number, required: true }
})

module.exports = mongoose.model('Service', ServiceSchema);