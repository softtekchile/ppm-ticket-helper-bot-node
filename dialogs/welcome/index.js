
const { CardFactory } = require('botbuilder');
const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { Utils } = require('../shared/utils');
const localizer = require('i18n');

let welcomeCard = require('./resources/welcomeCard.json');


// Dialog IDs
const WELCOME_DIALOG = 'welcomeDialog';

/**
 * @param {PropertyStateAccessor} userDataAccessor property accessor for user state
 */


class WelcomeDialog extends ComponentDialog {

    constructor(userDataAccessor){
        super(WelcomeDialog.name);
        if(!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');

        this.addDialog(new WaterfallDialog(WELCOME_DIALOG,[
            this.welcomeStep.bind(this)
        ]));

        this.userDataAccessor = userDataAccessor;
    }

    /**
     * Waterfall Dialog step function.
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    

     async welcomeStep(step, options){
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        await step.context.sendActivity(this.getWelcomeCard());
        await step.context.sendActivity(localizer.gettext(locale, 'welcome.readyPrompt'));

        await Utils.showMainMenu(step.context, locale);
        return await step.endDialog();
     }

     getWelcomeCard(locale) {
        const card = CardFactory.adaptiveCard(welcomeCard);
        return { attachments: [card] };    }
}

exports.WelcomeDialog = WelcomeDialog;
