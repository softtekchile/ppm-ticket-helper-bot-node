// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory } = require('botbuilder');

// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';
const PpmUserCard = require('../adaptiveCards/ppmUserCard.json');
const encrypt = require('../util/encrypt');

const phase = {
    standBy: 'standBy',
    welcome: 'welcome',
    auth: 'auth',
    createTicket: 'createTicket',
    encrypt: 'encrypt'
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
            const conversationData = await this.conversationData.get( turnContext, { conversationPhase: phase.welcome  });


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
                    await context.sendActivity('Bienvenido al servicio de creación de Tickets PPM '+ context.activity.from.name + 
                    ', para comenzar escriba cualquier mensaje.');

                    //await context.sendActivity({ attachments: [this.createAdaptiveCard()] });

                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (turnContext, next) => {
            const conversationData = await this.conversationData.get( turnContext, { conversationPhase: phase.welcome  });
            switch(turnContext.activity.text){
                case 'cancel':
                case 'quit':  
                    conversationData.conversationPhase = phase.standBy;
            };
            // Save any state changes. The load happened during the execution of the Dialog.

            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);
            
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    createAdaptiveCard() {
        return CardFactory.adaptiveCard(PpmUserCard);
    }

    static async conversationManager(conversationData, userProfile, turnContext) {
        switch (conversationData.conversationPhase) 
        {
            case phase.standBy:
                const text = turnContext.activity.text.toLowerCase();
                switch (text) 
                {
                    case "!encrypt":
                    case "encriptar":
                        await turnContext.sendActivity(`Envie el texto que desea encriptar`);
                        conversationData.conversationPhase = phase.encrypt;
                        break;
                    case "!who":
                    case "credenciales":
                    case "autenticacion":
                        await turnContext.sendActivity(`Correo: ${ userProfile.mail }`);
                        await turnContext.sendActivity(`pw: ${ userProfile.encryptedPw }`);
                        break;
                    case "!create":
                    case "ticket":
                    case "crear":
                        conversationData.conversationPhase = phase.createTicket;
                        break;
                    case "help":
                    case "?":
                    case "wat":
                    case "ayuda":
                        let msg = `Lista de comandos disponibles \r
                        !create - inicia la creación de ticket \r
                        !who - muestra las credenciales ingresadas \r
                        !changecredentials - permite cambiar credenciales \r
                        !encrypt - encripta el texto que se envia`;
                        await turnContext.sendActivity(msg);
                        break;
                    case "!changecredentials":
                    case "cambiar credenciales":
                        await turnContext.sendActivity(`${ userProfile.name }, por favor ingrese su mail.`);
                        conversationData.conversationPhase = phase.auth;
                        userProfile.mail = undefined;
                        userProfile.encryptedPw = undefined;
                        break;
                    default:
                        await turnContext.sendActivity(`${ userProfile.name }, En que le puedo ayudar. para ver la lista de comandos disponible escriba help`);
                        break;  
                }
                break;
            
            case phase.welcome:
                if(typeof userProfile.name == 'undefined'){
                    userProfile.name = turnContext.activity.from.name;
                }
                await turnContext.sendActivity(`${ userProfile.name }, por favor ingrese su mail.`);
                conversationData.conversationPhase = phase.auth;
                break;
                
            case phase.auth:
                
                if(typeof userProfile.mail == 'undefined'){

                    const val = await this.validateEmail(turnContext.activity.text);
                    if(val){
                        userProfile.mail = turnContext.activity.text;
                        await turnContext.sendActivity(`Su mail es  ${ userProfile.mail }.`);
                        await turnContext.sendActivity(`Ingrese su contraseña encriptada.`);
                    }else{
                        await turnContext.sendActivity(`Ingrese un mail con formato correcto.`);
                    }
                }else if(typeof userProfile.encryptedPw == 'undefined'){
                    userProfile.encryptedPw = turnContext.activity.text;
                    await turnContext.sendActivity(`Gracias por ingresar su contraseña encryptada. para ver la lista de comandos disponbiles escriba "help"`);
                    conversationData.conversationPhase = phase.standBy;
                }
                break;
            case phase.encrypt:
                var encryptedText = encrypt.encryptTest(turnContext.activity.text);
                await turnContext.sendActivity(`Aqui esta su texto encriptado: ${ encryptedText }`);
                conversationData.conversationPhase = phase.standBy;
                break;

        }

    }

    static async validateEmail(email) {
        var re = /^[\w.+\-]+@softtek\.com$/;
        return re.test(String(email).toLowerCase());
    }
}

module.exports.TicketHelperBot = TicketHelperBot;
