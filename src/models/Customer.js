const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    email: { type: String, required: true },
    document: { type: String, required: false },
    cart_id: { type: Number, required: true },
    external_id: { type: Number, required: false },
    date: { type: String, required: true },
    finish: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model('Customer', CustomerSchema);