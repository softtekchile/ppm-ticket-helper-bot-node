// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');

// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

const phase = {
    standBy: 'standBy',
    mail: 'mail',
    createTicket: 'createTicket'
    };

class TicketHelperBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        // Create the state property accessors for the conversation data and user profile.
        this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);
        // The state management objects for the conversation and user state.
        this.conversationState = conversationState;
        this.userState = userState;

        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (turnContext, next) => {
            // Get the state properties from the turn context.
            const userProfile = await this.userProfile.get(turnContext, {});
            const conversationData = await this.conversationData.get( turnContext, { conversationPhase: phase.mail  });

            await TicketHelperBot.conversationManager(conversationData, userProfile, turnContext);
            if (conversationData.conversationPhase == phase.createTicket){
                await this.dialog.run(turnContext, this.dialogState);
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Bienvenido a Bot Crear Ticket Service '+ context.activity.from.name);

                    await context.sendActivity('Por favor ingrese su correo');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (turnContext, next) => {
            const conversationData = await this.conversationData.get( turnContext, { conversationPhase: phase.mail  });
            switch(turnContext.activity.text){
                case 'cancel': 
                    conversationData.conversationPhase = phase.standBy;
            };
            // Save any state changes. The load happened during the execution of the Dialog.

            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);
            
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    static async conversationManager(conversationData, userProfile, turnContext, d) {

        switch (conversationData.conversationPhase) {
            case phase.standBy:
                if (turnContext.activity.text == "!mail")
                {
                    await turnContext.sendActivity(`Correo: ${ userProfile.mail }`);
                }
                if (turnContext.activity.text == "!create")
                {
                    conversationData.conversationPhase = phase.createTicket;
                }
                break;
            
            case phase.mail:
                userProfile.name = turnContext.activity.from.name;
                await turnContext.sendActivity(`Gracias ${ userProfile.name }.`);
                userProfile.mail = turnContext.activity.text;
                conversationData.conversationPhase = phase.standBy;
                break;
        }

    }
}

module.exports.TicketHelperBot = TicketHelperBot;
