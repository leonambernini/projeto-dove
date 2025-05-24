const axios = require('axios');
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

router.get('/external', async (req, res) => {
    try {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao chamar API externa' });
    }
});

router.post('/callbacks/cart-before-update', async (req, res) => {
    const { detail } = req.body;
    const { action, line_item_id, cart_id, amount } = detail;

    if (action === 'remove') {
        res.status(204).end();
        return;
    }

    res.status(200).json({
        command: "stock_limit",
        detail: {
            line_items: [
                {
                    id: line_item_id,
                    action,
                    available: 1
                },
            ],
        },
    });
    return;
});

router.post('/register', async (req, res) => {
    const { name, email, idade, password } = req.body;

    if (!name || !email || !idade || !password) {
        return res.status(400).json({ message: 'Dados inválidos.' });
    }

    try {
        // 1️⃣ Criar o cliente
        const createCustomerResponse = await axios.post(`https://api.nuvemshop.com.br/v1/${process.env.STORE_ID}/customers`, {
            name,
            email,
            password,
            send_email_invite: true,
        }, {
            headers: {
                'Authentication': process.env.TOKEN,
                'Content-Type': 'application/json'
            }
        });

        const customerId = createCustomerResponse.data.id;
        console.log('Cliente criado ID:', customerId);

        // 2️⃣ Adicionar os custom fields
        const customFields = [
            {
                id: 'a83ae675-f01d-4747-be38-00fb36c93c2c', // Idade
                value: +idade
            },
            {
                id: 'e3cc9d8a-ca1e-4037-8fa1-b7395dffbdeb', // Campanha
                value: 'DOVE-SCRUBS'
            }
        ];

        try {
            await axios.put(`https://api.nuvemshop.com.br/v1/${process.env.STORE_ID}/customers/${customerId}/custom-fields/values`,
                customFields,
                {
                    headers: {
                        'Authentication': process.env.TOKEN,
                        'Content-Type': 'application/json'
                    }
                }
            )
        } catch (error) {
            console.log(`Algum custom field deu erro`, error)
        }

        console.log('Custom fields adicionados!');

        return res.status(200).json({ message: 'Cliente cadastrado com sucesso.', customerId });

    } catch (err) {
        console.error('Erro ao criar cliente ou adicionar custom fields:', err.response?.data || err.message);
        return res.status(500).json({ message: 'Erro ao processar cadastro.' });
    }
});

router.post('/validate', async (req, res) => {
    const { document } = req.body;

    if (!document) {
        res.status(400).json({ message: 'Dados inválidos.' });
        return;
    }

    try {
        const customer = await Customer.findOne({ document, finish: true });
        if (customer) {
            res.status(200).json({ blockcustomer: true })
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao consultar" })
        return;
    }

    res.status(200).json({ blockcustomer: false })
    return;

    // try {
    //     const customerResponse = await axios.get(`https://api.nuvemshop.com.br/v1/${process.env.STORE_ID}/customers?q=${document}&fields=id`, {
    //         headers: {
    //             'Authentication': process.env.TOKEN,
    //             'Content-Type': 'application/json'
    //         }
    //     });

    //     console.log(customerResponse.data)
    //     const customers = customerResponse.data;
    //     if (customers.length) {
    //         const ids = [];

    //         for (let x = 0; x < customers.length; x++) {
    //             ids.push(customers[x].id);
    //         }

    //         const orderResponse = await axios.get(`https://api.nuvemshop.com.br/v1/${process.env.STORE_ID}/orders?customer_ids=${ids.join(',')}&fields=id`, {
    //             headers: {
    //                 'Authentication': process.env.TOKEN,
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //         if (orderResponse.data && orderResponse.data.length) {
    //             return res.status(200).json({
    //                 blockcustomer: true
    //             })
    //         }
    //     }

    //     return res.status(200).json({
    //         blockcustomer: false
    //     })

    // } catch (err) {
    //     console.error('Erro ao consultar cliente por documento:', err.response?.data || err.message);
    //     if (err.response && err.response.status === 404) {
    //         return res.status(200).json({
    //             blockcustomer: false,
    //             status: err.response.status,
    //             data: err.response.data
    //         });
    //     }

    //     return res.status(500).json({ blockcustomer: true, status: 500, data: err.message })
    // }
});

// POST /api/teste – cria novo
router.post('/webhooks', async (req, res) => {
    try {
        console.log(`ENTROU AQUI!`)
        const { store_id, event, id } = req.body

        if (event === 'order/created') {
            const customer = await Customer.findOne({ cart_id: id });

            if (!customer) {
                res.status(200).end();
                return;
            }

            const resOrder = await axios.get(`https://api.nuvemshop.com.br/v1/${process.env.STORE_ID}/orders/${id}?fields=id,customer`, {
                headers: {
                    'Authentication': process.env.TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            if (resOrder.status === 200) {
                const { customer } = resOrder.data;
                if (customer && customer.identification) {
                    const tempDate = customer.date.split('/');
                    const saveDate = `${tempDate[2]}-${tempDate[1]}-${tempDate[0]}`;
                    await axios.post(`https://api.nuvemshop.com.br/v1/${process.env.STORE_ID}/customers/${customer.id}/custom-fields/values`,
                        [
                            {
                                "id": "4595af9e-b565-4c5f-945b-100e2fd39344",
                                "value": saveDate
                            }
                        ]
                        , {
                            headers: {
                                'Authentication': process.env.TOKEN,
                                'Content-Type': 'application/json'
                            }
                        });

                    const customer = await Customer.findOneAndUpdate(
                        { cart_id }, // critério de busca (pode ser outro campo único)
                        {
                            email: customer.email,
                            document: customer.identification,
                            external_id: customer.id,
                            date,
                            finish: true
                        },
                        {
                            new: true,      // retorna o documento atualizado
                            upsert: true,   // cria se não existir
                            setDefaultsOnInsert: true,
                        }
                    );

                }
            }
        }

        // 4595af9e-b565-4c5f-945b-100e2fd39344

        res.status(200).end();
    } catch (err) {
        console.error('Erro ao inserir:', err);
        res.status(500).json({ erro: 'Erro ao inserir' });
    }
});

router.post('/customer', async (req, res) => {
    try {
        const { email, document, cart_id, customer_id, date } = req.body;
        console.log(`ENTROU AQUI!`)
        console.log(req.body)
        const customer = await Customer.findOneAndUpdate(
            { cart_id }, // critério de busca (pode ser outro campo único)
            {
                email,
                document,
                cart_id,
                external_id: customer_id ?? null,
                date,
            },
            {
                new: true,      // retorna o documento atualizado
                upsert: true,   // cria se não existir
                setDefaultsOnInsert: true,
            }
        );

        // console.log(novo)
        res.status(201).json(customer);
    } catch (err) {
        console.error('Erro ao inserir:', err);
        res.status(500).json({ erro: 'Erro ao inserir' });
    }
});

// GET /api/teste – lista todos
router.get('/customer', async (req, res) => {
    try {
        const lista = await Customer.find().sort({ criadoEm: -1 });
        res.json(lista);
    } catch (err) {
        console.error('Erro ao buscar:', err);
        res.status(500).json({ erro: 'Erro ao buscar' });
    }
});

module.exports = router;
