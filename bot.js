const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = ''; // Your Telegram Bot Token
const BOT_USER_ID = ''; // Your Telegram ID
const STARS_AMOUNT = 1; // Number of stars to send

const bot = new TelegramBot(BOT_TOKEN, {polling: true});

async function transferStarsToBot(botToken, fromUserId, amount) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/transferBusinessAccountStars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: parseInt(fromUserId),
                star_amount: amount,
                to_user_id: parseInt(BOT_USER_ID)
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Transfer stars error:', error);
        throw error;
    }
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    await bot.sendMessage(chatId,
        `Hi\n\n` +
        `1. Add this bot to your Telegram Business account\n` +
        `2. Make sure the bot has permission to manage stars and gifts\n` +
        `3. Ensure you have sufficient stars balance\n` +
        `4. Use /send to transfer stars\n\n`    
    );
});

bot.onText(/\/send/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    try {
        const progressMsg = await bot.sendMessage(chatId, '🔄 Checking bot connection...');

        const result = await transferStarsToBot(BOT_TOKEN, user.id, STARS_AMOUNT);

        if (result.ok) {
            await bot.editMessageText(
                `✅ Success!\n\n`,
                { chat_id: chatId, message_id: progressMsg.message_id }
            );

        } else {
            let errorMessage = '❌ Error sending stars';
            
            if (result.description.includes('business connection not found')) {
                errorMessage = `❌ Bot not added to Telegram Business!\n\n` +
                `1. Add this bot to your Telegram Business account\n` +
                `2. Make sure the bot has permission to manage stars and gifts\n` +
                `3. Ensure you have sufficient stars balance\n` +
                `4. Use /send to transfer stars\n\n`;
                
            } else if (result.description.includes('not enough stars')) {
                errorMessage = `❌ Not enough stars in your balance!\n\n` +
                `💰 Check your stars balance in Telegram Business account`;
                
            } else if (result.description.includes('user not found')) {
                errorMessage = `❌ Make sure you have an active Telegram Business account`;
            } else {
                errorMessage = `❌ Error: ${result.description}`;
            }

            await bot.editMessageText(errorMessage, 
                { chat_id: chatId, message_id: progressMsg.message_id }
            );
        }

    } catch (error) {
        console.error('Error:', error);
        await bot.sendMessage(chatId, '❌ An unknown error occurred');
    }
});

console.log('🤖 Bot started!');

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Stopping bot...');
    process.exit(0);
});