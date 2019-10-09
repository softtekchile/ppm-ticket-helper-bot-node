const { ComponentDialog } = require('botbuilder-dialogs');
const { CancelDialog } = require('../cancel');
const { Utils } = require('../shared/utils');
const localizer = require('i18n');

/**
 *
 * @param {PropertyStateAccessor} userDataAccessor property accessor for user state
 */
class DefaultDialog extends ComponentDialog {
    constructor(userDataAccessor) {
        super(DefaultDialog.name);

        if (!userDataAccessor) throw new Error('DefaultDialog constructor missing parameter: userDataAccessor is required.');

        this.userDataAccessor = userDataAccessor;

        // Supported LUIS Intents.
        this.intentHandler = {
            'DefaultCancelDialog': this.cancelDialog,
            'DefaultHelpDialog': this.helpDialog
        };
    }

    async isTurnInterrupted(dc, intent) {
        let handler = this.intentHandler[intent];

        if (handler !== undefined) {
            handler = handler.bind(this);
            return await handler(dc);
        }

        // This is not an interruption
        return false;
    }

    async cancelDialog(dc) {
        // Avoid "cancelling" the Cancel dialog.
        if (dc.activeDialog && dc.activeDialog.id === CancelDialog.name) {
            return false;
        }

        if (!dc.activeDialog) {
            const userData = await this.userDataAccessor.get(dc.context);
            await dc.context.sendActivity(localizer.gettext(userData.locale, 'cancel.nothing'));

            return true;
        }
        // This is a special case that leads to a new dialog,
        // so it's not handled as a normal interruption flow.
        await dc.beginDialog(CancelDialog.name);
        return false;
    }

    async helpDialog(dc) {
        const userData = await this.userDataAccessor.get(dc.context);
        const locale = userData.locale;
        const restartCommand = localizer.gettext(locale, 'commands.restart');
        const createTicketCommand = localizer.gettext(locale, 'commands.createTicket');
        const cancelCommand = localizer.gettext(locale, 'commands.cancel');

        let msg = localizer.gettext(locale, 'help.introduction');
        msg += '\r' + localizer.gettext(locale, 'help.restart', restartCommand);
        msg += '\r' + localizer.gettext(locale, 'help.createTicket', createTicketCommand);
        msg += '\r' + localizer.gettext(locale, 'help.cancel', cancelCommand);

        await dc.context.sendActivity(msg);

        if (!dc.activeDialog) {
            // Only show if we are in the root dialog.
            await dc.context.sendActivity(localizer.gettext(locale, 'readyPrompt'));
            await Utils.showMainMenu(dc.context, locale);
        }

        return true;
    }
};

exports.DefaultDialog = DefaultDialog;