const path = require('path')
const restify = require('restify');
const localizer = require('i18n');
//https://www.npmjs.com/package/i18n mas informacion de locales

const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');

const { TicketHelperBot } = require('./bots/bot');

const ENV_FILE = path.join(__dirname, 'config/.env');
require('dotenv').config({ path: ENV_FILE });

const adapter = new BotFrameworkAdapter({
    appId: process.env.microsoftAppID,
    appPassword: process.env.microsoftAppPassword
});

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

localizer.configure({
    //defaultLocale: 'en-US',
    defaultLocale: 'es-CL',
    directory: path.join(__dirname, './locales'),
    objectNotation: true // Supports hierarchical translation. For instance, allows to use 'welcome.readyPrompt'
});

// Mimic the old v3 session.localizer.gettext()
// https://docs.microsoft.com/en-us/azure/bot-service/nodejs/bot-builder-nodejs-localization?view=azure-bot-service-3.0#localize-prompts
localizer.gettext = function(locale, key, args) {
    return this.__({ phrase: key, locale: locale }, args);
};

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError]: ${ error }`);
    await context.sendActivity(`Oops. Something went wrong!`);
    await conversationState.load(context);
    await conversationState.clear(context);
    await conversationState.saveChanges(context);
};

let bot;
try {
    bot = new TicketHelperBot(conversationState, userState);
} catch (err) {
    console.error(`[botInitializationError]: ${ err }`);
    process.exit();
}

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open config/development.bot file in the Emulator`);
});

server.post('/api/messages', (req, res) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await bot.onTurn(turnContext);
    });
});