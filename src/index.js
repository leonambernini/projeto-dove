require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/api');
const proxyRoutes = require('./routes/proxy');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(cors());
app.use(express.json());

app.set('views', path.join(__dirname, 'templates')); // pasta dos templates
app.set('view engine', 'ejs');

app.use('/api', apiRoutes);
app.use('/proxy', proxyRoutes);

const PORT = process.env.PORT || 3444;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
