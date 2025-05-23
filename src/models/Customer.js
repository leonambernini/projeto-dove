const mongoose = require('mongoose');

const TesteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Teste', TesteSchema);