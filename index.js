const TelegramBot = require('node-telegram-bot-api');const mongoose = require('mongoose');
const crypto = require('crypto');

// --- Configuration ---
const TOKEN = '';
const MONGO_URI = '';

// --- MongoDB Setup ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('Bot: Successfully connected to MongoDB.'))
  .catch(err => console.error('Bot: MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  uid: { type: Number, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// --- Telegram Bot Setup ---
const bot = new TelegramBot(TOKEN, { polling: true });
console.log('Bot is running and listening for commands...');

// --- Event Listeners ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramUid = msg.from.id;

  try {
    const existingUser = await User.findOne({ uid: telegramUid });
    if (existingUser) {
      return bot.sendMessage(chatId, 'You already have an account registered!');
    }

    // 1. Generate the plain text password
    const plainTextPassword = crypto.randomBytes(8).toString('hex');

    // 2. Save the plain text password directly to the database
    const newUser = new User({
      uid: telegramUid,
      password: plainTextPassword
    });
    await newUser.save();

    // 3. Send the password to the user
    const responseMessage = `Welcome! Your account has been created.\n\n` +
                            `👤 **User ID (UID):** ${telegramUid}\n` +
                            `🔑 **Password:** ${plainTextPassword}\n\n` +
                            `Please save this password!`;

    bot.sendMessage(chatId, responseMessage, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error creating account:', error);
    bot.sendMessage(chatId, 'Sorry, there was an error creating your account.');
  }
});
