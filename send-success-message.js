#!/usr/bin/env node

const https = require('https');

const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: "61493348617", 
    type: "text",
    text: {
        body: `🎉 SUCCESS! WhatsApp Automation LIVE on GitHub Pages!

🌐 Live URL: https://rind-ai.github.io/whatsapp-automation-live/
📊 Admin Dashboard: Available now
📱 Business Phone: +1 555 138 7950

✅ DEPLOYMENT COMPLETE:
- Zero cost hosting on GitHub Pages
- Working tokens integrated  
- Professional automation ready
- 24/7 customer service system

🔧 FINAL STEP:
Update Facebook webhook URL to complete automation.

📋 Guide created: GITHUB_PAGES_SUCCESS.md

Your meat business automation is ready! 🥩`
    }
});

const options = {
    hostname: 'graph.facebook.com',
    path: '/v22.0/816226238231026/messages',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer EAAKhEtZCzfAMBPakg0nsaWbU9i2TEY68mG1MF5DxbHP8UdNun9ZCjhxrCXVscSNAIaJJzrjUdQGnB04ctbZCANCI41ZBAu0vYQyV7ZCYWpXlTIwfe5pZAmf3uxUGFcmhUJwMsfZCyRtwoGQ7J0fVZCAE4ApBKIRvFc2vSXr4Tf6DjFbJZAoizaDKYseUwFzGp2D3bVmyuY7Yqvfei6SWuVo8cLJCce6BH3IpnNZBGU0cQ6fQ5a9wZDZD',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
        const response = JSON.parse(responseData);
        if (response.messages && response.messages[0].id) {
            console.log('✅ SUCCESS MESSAGE SENT!');
            console.log(`Message ID: ${response.messages[0].id}`);
            console.log(`Recipient: ${response.contacts[0].wa_id}`);
        } else {
            console.log('Response:', response);
        }
    });
});

req.on('error', (error) => console.error('❌ Error:', error));
req.write(data);
req.end();