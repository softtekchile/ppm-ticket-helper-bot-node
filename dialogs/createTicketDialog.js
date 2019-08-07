'use strict';

const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const fs = require('fs');

const axios = require("axios");
const url = "http://httpbin.org/post";
const { PpmSettings } = require('../ppmSettings');

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

const PPM_SETTINGS = 'PPM_SETTINGS';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class CreateTicketDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super('createTicketDialog');

        this.ppmSettings = userState.createProperty(PPM_SETTINGS);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.assignStep.bind(this),
            this.reasonStep.bind(this),
            this.impactStep.bind(this),
            this.urgencyStep.bind(this),
            this.priorityStep.bind(this),
            this.descriptionStep.bind(this),
            this.confirmStep.bind(this),
            this.resultStep.bind(this)
            
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async assignStep(step) {
        return await step.prompt(TEXT_PROMPT, `Escriba el nombre de la persona a la que será asignado este Ticket`);
    }

    async reasonStep(step) {
        step.values.assignedTo = step.result;
        await step.context.sendActivity(`El ticket será asignado a: ${ step.values.assignedTo }`);

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Selecciona la razon: ',
            choices: ChoiceFactory.toChoices(['Documentation', 'New Asset Request', 'Software Installation', 'Estimation/Collaboration', 'Analysis/Collaboration', 
            'Design/Collaboration', 'Testing/Collaboration', 'Disaster Recovery/Collaboration', 'Data Load'])
        });
    }

    async impactStep(step) {
        await step.context.sendActivity(`Razón escogida ${ step.result.value }`);
        step.values.reason = step.result.value;
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Selecciona el impacto: ',
            choices: ChoiceFactory.toChoices(['Low', 'Medium', 'High'])
        });
    }

    async urgencyStep(step) {
        await step.context.sendActivity(`Nivel de impacto escogido: ${ step.result.value }`);
        step.values.impact = step.result.value;
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Selecciona el la urgencia: ',
            choices: ChoiceFactory.toChoices(['Low', 'Medium', 'High'])
        });
    }

    async priorityStep(step) {
        await step.context.sendActivity(`Nivel de urgencia escogida: ${ step.result.value }`);
        step.values.urgency = step.result.value;
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Selecciona la prioridad: ',
            choices: ChoiceFactory.toChoices(['Low', 'Medium', 'High'])
        });
    }

    async descriptionStep(step) {
        await step.context.sendActivity(`Nivel de prioridad escogida: ${ step.result.value }`);
        step.values.priority = step.result.value;

        return await step.prompt(TEXT_PROMPT, `Ingrese descripcion del ticket. Ej: GTD-XXX - QS-SN-XXX - [Descripción representativa de la solicitud] `);
    }

    async confirmStep(step) {
        step.values.description = step.result;

        // Get the current profile object from user state.
        const ppmSettings = await this.ppmSettings.get(step.context, new PpmSettings());

        ppmSettings.assignedTo = step.values.assignedTo;
        ppmSettings.reason = step.values.reason;
        ppmSettings.impact = step.values.impact;
        ppmSettings.urgency = step.values.urgency;
        ppmSettings.priority = step.values.priority;
        ppmSettings.description = step.values.description;
        
        let msg = `El siguiente Ticket será creado:\n
        Org Unit: ${ ppmSettings.orgUnit }\n
        WBS: ${ ppmSettings.wbs }\n
        Assigned To: ${ ppmSettings.assignedTo }\n
        Reason: ${ ppmSettings.reason } \n
        Impact: ${ ppmSettings.impact } \n
        Urgency: ${ ppmSettings.urgency } \n
        Priority: ${ ppmSettings.priority } \n
        Description: ${ ppmSettings.description } \n
        Location: ${ ppmSettings.location } \n`;
        await step.context.sendActivity(msg);

        step.values.ppm = ppmSettings;

        return await step.prompt(CONFIRM_PROMPT, { prompt: 'Es esto correcto?' });
    }

    async resultStep(step) {

        if (step.result) {
            const data = await getData(step.values.ppm);
            await step.context.sendActivity(`La id del ticket creado es: ${ data.id_ppm }`);
        }
        else
        {
            await step.context.sendActivity(`La creación del ticket a sido cancelada.`);

        }

        return await step.endDialog();
    }
}

const getData = async (ppmSettings) =>  {
    try {
      const response = await axios.post(url, { ppm : ppmSettings, id_ppm : '1234567'});
      const data = response.data;
      console.log(data);
      const content = JSON.parse(data.data);
      return content;
    } catch (error) {
      console.log(error);
    }
  };

module.exports.CreateTicketDialog = CreateTicketDialog;

