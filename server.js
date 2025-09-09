const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Environment variables with working values
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAKhEtZCzfAMBPakg0nsaWbU9i2TEY68mG1MF5DxbHP8UdNun9ZCjhxrCXVscSNAIaJJzrjUdQGnB04ctbZACNCI41ZBAu0vYQyV7ZCYWpXlTIwfe5pZAmf3uxUGFcmhUJwMsfZCyRtwoGQ7J0fVZCAE4ApBKIRvFc2vSXr4Tf6DjFbJZAoizaDKYseUwFzGp2D3bVmyuY7Yqvfei6SWuVo8cLJCce6BH3IpnNZBGU0cQ6fQ5a9wZDZD';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || '816226238231026';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'meat_business_2025';

// Store for orders and customers (in production, use a database)
let orders = [];
let customers = new Map();

console.log('🚀 WHATSAPP MEAT BUSINESS - GITHUB AUTOMATION');
console.log('=============================================');
console.log('📱 Phone ID:', PHONE_NUMBER_ID);
console.log('🔑 Token:', WHATSAPP_TOKEN ? 'Configured ✅' : 'Missing ❌');
console.log('🔐 Verify Token:', VERIFY_TOKEN);
console.log('');

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook Verification Request:');
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully!');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook verification failed!');
            res.sendStatus(403);
        }
    } else {
        console.log('❌ Invalid verification request');
        res.sendStatus(400);
    }
});

// Send WhatsApp message
async function sendWhatsAppMessage(to, message) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Message sent to ${to}:`, response.data.messages[0].id);
        return response.data;
    } catch (error) {
        console.error(`❌ Error sending message to ${to}:`, error.response?.data || error.message);
        throw error;
    }
}

// Generate meat menu
function getMeatMenu() {
    return `🥩 **PREMIUM MEATS MELBOURNE** 🥩

🔸 **BEEF SELECTION:**
• Ribeye Steak - $25/lb
• Ground Beef - $8/lb
• Beef Tenderloin - $35/lb
• T-Bone Steak - $22/lb

🔸 **CHICKEN SELECTION:**
• Whole Chicken - $12/ea
• Chicken Breast - $15/lb
• Chicken Thighs - $10/lb
• Chicken Wings - $8/lb

🔸 **PORK SELECTION:**
• Pork Chops - $18/lb
• Bacon - $12/lb
• Pork Tenderloin - $22/lb

🔸 **LAMB SELECTION:**
• Lamb Chops - $28/lb
• Ground Lamb - $16/lb
• Leg of Lamb - $24/lb

📝 **TO ORDER:** Reply with "order: [quantity] [item]"
📧 **EMAIL:** info@premiummeatsmelbourne.com
🕒 **HOURS:** 8AM-8PM Monday-Saturday
🚚 **FREE DELIVERY** over $50!

Thank you for choosing Premium Meats Melbourne! 🙏`;
}

// Generate welcome message
function getWelcomeMessage() {
    return `👋 **Welcome to Premium Meats Melbourne!**

🥩 We're your premier source for high-quality meats in Melbourne!

📋 Send "**menu**" to see our full selection
📞 Send "**contact**" for our information
💰 Send "**payment**" for payment options
🛒 Send "**order: 2lb ribeye steak**" to place an order

We're here to serve you with the finest meats! 🌟`;
}

// Generate contact info
function getContactInfo() {
    return `📞 **PREMIUM MEATS MELBOURNE - CONTACT**

🏪 **ADDRESS:**
123 Melbourne Street
Melbourne VIC 3000
Australia

📞 **PHONE:** +61 3 9xxx xxxx
📧 **EMAIL:** info@premiummeatsmelbourne.com
🌐 **WEBSITE:** www.premiummeatsmelbourne.com

🕒 **BUSINESS HOURS:**
Monday - Saturday: 8:00 AM - 8:00 PM
Sunday: CLOSED

🚚 **DELIVERY:** Available Melbourne-wide
💳 **PAYMENT:** Cash, Card, Bank Transfer

We look forward to serving you! 🥩`;
}

// Process order
function processOrder(orderText, customerPhone) {
    const orderNumber = Date.now().toString().slice(-6);
    const order = {
        id: orderNumber,
        customer: customerPhone,
        text: orderText,
        status: 'pending',
        timestamp: new Date().toISOString(),
        total: 0 // Calculate based on items
    };
    
    orders.push(order);
    
    // Update customer info
    if (customers.has(customerPhone)) {
        customers.get(customerPhone).orders++;
    } else {
        customers.set(customerPhone, {
            phone: customerPhone,
            firstOrder: new Date().toISOString(),
            orders: 1
        });
    }
    
    return `🎉 **ORDER CONFIRMED!**

📋 **Order #${orderNumber}**
🛒 **Items:** ${orderText}
📱 **Customer:** ${customerPhone}
📅 **Time:** ${new Date().toLocaleString()}

✅ **STATUS:** Processing
💰 **Payment:** Please pay on delivery or transfer to our bank account

📞 We'll contact you within 30 minutes to confirm delivery details!

Thank you for your order! 🥩🙏`;
}

// Handle incoming WhatsApp messages
app.post('/webhook', (req, res) => {
    console.log('📨 Webhook received:', JSON.stringify(req.body, null, 2));
    
    try {
        const entries = req.body.entry || [];
        
        for (const entry of entries) {
            const changes = entry.changes || [];
            
            for (const change of changes) {
                if (change.field === 'messages') {
                    const messages = change.value.messages || [];
                    
                    for (const message of messages) {
                        const from = message.from;
                        const messageBody = message.text?.body?.toLowerCase().trim();
                        
                        console.log(`📱 Message from ${from}: "${messageBody}"`);
                        
                        // Process different message types
                        let responseMessage = '';
                        
                        if (messageBody === 'menu') {
                            responseMessage = getMeatMenu();
                        } else if (messageBody === 'hello' || messageBody === 'hi' || messageBody === 'start') {
                            responseMessage = getWelcomeMessage();
                        } else if (messageBody === 'contact') {
                            responseMessage = getContactInfo();
                        } else if (messageBody === 'payment') {
                            responseMessage = `💳 **PAYMENT OPTIONS**

1️⃣ **Cash on Delivery** (COD)
2️⃣ **Bank Transfer:**
   Account: Premium Meats Melbourne
   BSB: 123-456
   Account: 12345678
   
3️⃣ **Card Payment** (on delivery)

💰 **FREE DELIVERY** for orders over $50
🚚 **Delivery Fee:** $5 for orders under $50

Please mention your order number when paying! 📋`;
                        } else if (messageBody.startsWith('order:')) {
                            const orderText = messageBody.replace('order:', '').trim();
                            responseMessage = processOrder(orderText, from);
                        } else {
                            responseMessage = `🤖 **Hi there!** I didn't understand that message.

📋 Try sending:
• "**menu**" - See our meat selection
• "**contact**" - Get our contact info
• "**payment**" - Payment options
• "**order: 2lb ribeye steak**" - Place an order

How can I help you today? 😊`;
                        }
                        
                        // Send response
                        if (responseMessage) {
                            sendWhatsAppMessage(from, responseMessage)
                                .then(() => console.log(`✅ Response sent to ${from}`))
                                .catch(error => console.error(`❌ Failed to send to ${from}:`, error.message));
                        }
                    }
                }
            }
        }
        
        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin dashboard endpoint
app.get('/admin', (req, res) => {
    const stats = {
        totalOrders: orders.length,
        totalCustomers: customers.size,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        todaysSales: 0,
        recentOrders: orders.slice(-5),
        recentCustomers: Array.from(customers.values()).slice(-5)
    };
    
    res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        phoneId: PHONE_NUMBER_ID,
        tokenConfigured: !!WHATSAPP_TOKEN
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'WhatsApp Meat Business Automation',
        status: 'running',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhook',
            admin: '/admin', 
            health: '/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`📊 Admin URL: http://localhost:${PORT}/admin`);
    console.log('');
    console.log('✅ WhatsApp Meat Business Automation is READY!');
});

module.exports = app;