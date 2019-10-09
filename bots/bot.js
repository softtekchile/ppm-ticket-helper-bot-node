const { DialogSet } = require('botbuilder-dialogs');
const { MainDialog } = require('../dialogs/main');
const DIALOG_STATE_PROPERTY = 'dialogState';


class TicketHelperBot {
    /**
    * @param {ConversationState} conversationState property accessor
    * @param {UserState} userState property accessor
    */

    constructor(conversationState, userState) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');

        const dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.dialogs = new DialogSet(dialogState);
        this.dialogs.add(new MainDialog(conversationState, userState));
    }

    async onTurn(turnContext) {
        const dc = await this.dialogs.createContext(turnContext);
        await dc.continueDialog();
        if (!dc.context.responded) {
            await dc.beginDialog(MainDialog.name);
        }
    }
}

module.exports.TicketHelperBot = TicketHelperBot;