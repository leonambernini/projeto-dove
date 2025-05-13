const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', CustomerSchema);
