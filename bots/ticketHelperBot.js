// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const axios = require("axios");
const url = "http://httpbin.org/post";

const { ActivityHandler } = require('botbuilder');

// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

class TicketHelperBot extends ActivityHandler {
    constructor(conversationState, userState, dialog) {
        super();
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
            const conversationData = await this.conversationData.get(
                turnContext, { promptedForMail: false, promptedForCreateTicket: false});

            if(!userProfile.name)
            {
                userProfile.name = turnContext.activity.from.name;
                userProfile.post = await getData(url);
            }
            if (!conversationData.promptedForMail) {
                // First time around this is undefined, so we will prompt user for name.
                await turnContext.sendActivity(`Gracias ${ userProfile.name }.`);
                userProfile.mail = turnContext.activity.text;
                conversationData.promptedForMail = true;
            } 
            if (turnContext.activity.text == "!mail")
            {
                await turnContext.sendActivity(`Correo: ${ userProfile.mail }`);
            }
            if (turnContext.activity.text == "!create")
            {
                conversationData.promptedForCreateTicket = true;
            }
            if (conversationData.promptedForCreateTicket) {
                await this.dialog.run(turnContext, this.dialogState);

            } 


            
            /*
            else  
            {
                await this.dialog.run(turnContext, this.dialogState);

               ECHOOOOO
                Add message details to the conversation data.
                conversationData.timestamp = turnContext.activity.timestamp.toLocaleString();
                conversationData.channelId = turnContext.activity.channelId;

                // Display state data.
                await turnContext.sendActivity(`${ userProfile.name } sent: ${ turnContext.activity.text }`);
                await turnContext.sendActivity(`Correo: ${ userProfile.mail }`);
                await turnContext.sendActivity(`post ${ userProfile.post.test }`);

                await turnContext.sendActivity(`Message received at: ${ conversationData.timestamp }`);
                await turnContext.sendActivity(`Message received from: ${ conversationData.channelId }`);
                
            }
            */
            // By calling next() you ensure that the next BotHandler is run.
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
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

const getData = async () => {
    try {
      const response = await axios.post(url, { test : 'contentTest'});
      const data = response.data;
      console.log(data);
      const content = JSON.parse(data.data);
      return content;
    } catch (error) {
      console.log(error);
    }
  };

module.exports.TicketHelperBot = TicketHelperBot;
