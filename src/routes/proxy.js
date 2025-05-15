require('dotenv').config();
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

console.log(process.env.CLIENT_SECRET)

const CLIENT_SECRET = `${process.env.CLIENT_SECRET}`; // define no .env

// Middleware para verificar o HMAC do Proxy
function verifyProxyRequest(req, res, next) {
    const storeId = req.header('X-Store-Id') || '';
    const customerId = req.header('X-Customer-Id') || '';
    const requestId = req.header('X-Request-Id') || '';
    const signature = req.header('X-Linkedstore-HMAC-SHA256') || '';

    console.log(`customerId ==>`, customerId)

    const stringToSign = storeId + customerId + requestId;
    const calculatedSignature = crypto
        .createHmac('sha256', CLIENT_SECRET)
        .update(stringToSign)
        .digest('hex');

    if (calculatedSignature !== signature) {
        return res.status(401).send('Unauthorized: Invalid signature');
    }

    next();
}

router.get('/', verifyProxyRequest, (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("X-Embed", "true");

    const now = new Date();
    const today18h = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    const today20h = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);

    let flags = {
        liberarProdutos: false,
        exibirContador: false,
    };

    let timerEnd;

    if (now >= today18h && now < today20h) {
        // Entre 18h e 20h → LIBERAR PRODUTOS
        flags.liberarProdutos = true;
    } else {
        // Fora desse horário → exibir cronômetro
        flags.exibirContador = true;

        if (now < today18h) {
            // Antes das 18h → cronômetro para hoje às 18h
            timerEnd = today18h;
        } else {
            // Depois das 20h → cronômetro para amanhã às 18h
            timerEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0, 0);
        }
    }

    res.status(200).render('dove-scrubs', {
        customerId: req.header('X-Customer-Id'),
        timerEnd: timerEnd ? timerEnd.toISOString() : null,
        ...flags
    });
});


module.exports = router;