const { ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { ActivityTypes } = require('botbuilder');
const { UserData } = require('../shared/userData');
const localizer = require('i18n');


// Import dialogs.
const { CancelDialog, WelcomeDialog, DefaultDialog, CreateTicketDialog } = require('../');

// State Accessor Properties
const MAIN_DIALOG_STATE_PROPERTY = 'mainDialogState';
const USER_DATA_PROPERTY = 'userDataProperty';

const DEFAULT_CANCEL_INTENT = 'DefaultCancel';
const DEFAULT_HELP_INTENT = 'DefaultHelp';
const NONE_INTENT = 'None';

// DialogTurnStatus default value
const DIALOG_TURN_STATUS_DEFAULT = { status: DialogTurnStatus.waiting };

/**
 *
 * @param {PropertyStateAccessor} userDataAccessor property accessor for user state
 */


class MainDialog extends ComponentDialog {
    constructor(conversationState, userState) {
        super(MainDialog.name);
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');

        this.conversationState = conversationState;
        this.userState = userState;

        // Create the property accessors for user and conversation state
        this.userDataAccessor = userState.createProperty(USER_DATA_PROPERTY);
        const dialogState = conversationState.createProperty(MAIN_DIALOG_STATE_PROPERTY);

        this.dialogs = new DialogSet(dialogState);
        this.dialogs.add(new CreateTicketDialog(this.userDataAccessor));
        this.dialogs.add(new CancelDialog(this.userDataAccessor));
        this.dialogs.add(new WelcomeDialog(this.userDataAccessor));

        this.defaultDialog = new DefaultDialog(this.userDataAccessor);

    }

    /**
     * Called anytime an instance of the component has been started.
     *
     * @param {DialogContext} dc Dialog context for the components internal `DialogSet`.
     */
    async onBeginDialog(dc) {
        // Override default begin() logic with bot orchestration logic
        return await this.onContinueDialog(dc);
    }

    async onContinueDialog(dc) {
        const context = dc.context;
        let turnResult = DIALOG_TURN_STATUS_DEFAULT;
        let locale = await this.getUserLocale(context);

        if (locale === undefined || locale === '') {
            locale =  localizer.getLocale() || context.activity.locale;

            if (!localizer.getLocales().includes(locale)) {
                locale = localizer.getLocale();
            }

            await this.setUserLocale(context, locale);
        }

        switch (context.activity.type) {
            // Handle Message activity type, which is the main activity type for shown within a conversational interface
            // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
            // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
            case ActivityTypes.Message:
                turnResult = await this.routeMessage(dc, locale);
                break;
    
            // Handle ConversationUpdate activity type, which is used to indicates new members add to
            // the conversation.
            // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
            case ActivityTypes.ConversationUpdate:
                turnResult = await this.welcomeUser(dc);
                break;
    
            default:
                // Handle other activity types as needed.
                break;
            }
    
            // make sure to persist state at the end of a turn.
            await this.conversationState.saveChanges(context);
            await this.userState.saveChanges(context);
    
            return turnResult;
    }

    async routeMessage(dc, locale) {
        let turnResult = DIALOG_TURN_STATUS_DEFAULT;
        const utterance = (dc.context.activity.text || '').trim().toLowerCase();
        
        const restartIntent = localizer.gettext(locale, 'synonyms.restart');

        const topIntent = this.checkIntent(utterance, locale);
        const interrupted = await this.defaultDialog.isTurnInterrupted(dc, topIntent);

        if (restartIntent.includes(utterance)) {
            let userData = new UserData();
            // Save locale and any other data you need to persist between resets
            userData.locale = locale;
            await this.userDataAccessor.set(dc.context, userData);
            await dc.cancelAllDialogs();
            turnResult = await dc.beginDialog(WelcomeDialog.name);
        }else if(interrupted){
            if (dc.activeDialog) {
                // issue a re-prompt on the active dialog
                await dc.repromptDialog();
            } 
        } 
        else if (dc.activeDialog && dc.activeDialog.id !== undefined) {
            turnResult = await dc.continueDialog();
        } else {
            turnResult = await dc.continueDialog();
            if (!dc.context.responded) {
            
                const TICKET_INTENT = localizer.gettext(locale, 'dialogs.createTicketDialog');
                const HELP_INTENT = localizer.gettext(locale, 'dialogs.defaultHelpDialog');
                switch (turnResult.status) {
                    // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
                    case DialogTurnStatus.empty:
                        // Determine what we should do based on the top intent from LUIS.
                        switch (topIntent) {
                        case TICKET_INTENT:
                            turnResult = await dc.beginDialog(CreateTicketDialog.name);
                            break;
                        case NONE_INTENT:
                        default:
                            // None or no intent identified, either way, let's query the QnA service.
                            turnResult = await this.defaultDialog.isTurnInterrupted(dc, HELP_INTENT);
                            break;
                        }
    
                        break;
    
                    case DialogTurnStatus.waiting:
                        // The active dialog is waiting for a response from the user, so do nothing.
                        break;
    
                    case DialogTurnStatus.complete:
                        // All child dialogs have ended. so do nothing.
                        break;
    
                    default:
                        // Unrecognized status from child dialog. Cancel all dialogs.
                        await dc.cancelAllDialogs();
                    }
            }
        }
        return turnResult;
    }
    checkIntent(utterance, locale){
        var topIntent;
        const ticketIntent = localizer.gettext(locale, 'synonyms.createTicket');
        const helpIntent = localizer.gettext(locale, 'synonyms.help');
        const cancelIntent = localizer.gettext(locale, 'synonyms.cancel');

        if(ticketIntent.includes(utterance))
        {
            topIntent = localizer.gettext(locale, 'dialogs.createTicketDialog');
        }
        else if (cancelIntent.includes(utterance))
        {
            topIntent = localizer.gettext(locale, 'dialogs.defaultCancelDialog');
        }
        else if (helpIntent.includes(utterance))
        {
            topIntent = localizer.gettext(locale, 'dialogs.defaultHelpDialog');
        }
        else{
            topIntent = NONE_INTENT;
        }
        return topIntent;
    }

    async welcomeUser(dc) {
        let turnResult = DIALOG_TURN_STATUS_DEFAULT;
        const context = dc.context;
        if (context.activity.membersAdded.length !== 0) {
            for (var idx in context.activity.membersAdded) {
                if (context.activity.membersAdded[idx].id === context.activity.recipient.id) {
                    turnResult = await dc.beginDialog(WelcomeDialog.name);
                }
            }
        }
        return turnResult;
    }

    /**
     * Helper function to get user's locale.
     *
     * @param {TurnContext} context The turn context for the current turn of conversation.
     */
    async getUserLocale(context) {
        // get userData object using the accessor
        let userData = await this.userDataAccessor.get(context);

        if (userData === undefined) {
            return undefined;
        }

        return userData.locale;
    }
    /**
     * Helper function to update user's locale.
     *
     * @param {TurnContext} context The turn context for the current turn of conversation.
     * @param {String} locale - new user locale
     */
    async setUserLocale(context, newLocale) {
        // get userData object using the accessor
        let userData = await this.userDataAccessor.get(context);

        if (userData === undefined) {
            userData = new UserData();
        }

        if (userData.locale !== newLocale && newLocale !== '' && newLocale !== undefined) {
            userData.locale = newLocale;
            await this.userDataAccessor.set(context, userData);
        }
    }
}

exports.MainDialog = MainDialog;
