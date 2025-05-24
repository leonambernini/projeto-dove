const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    email: { type: String, required: true },
    cart_id: { type: Number, required: true },
    external_id: { type: Number, required: false },
    date: { type: String, required: true },
});

module.exports = mongoose.model('Customer', CustomerSchema);