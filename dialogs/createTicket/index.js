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

//http request con axios
const axios = require("axios");
const url = "http://localhost:8888/ppm-ticket-helper-service-0.0.1-SNAPSHOT/ticketService/getTicketData";

//UTILS
const { Utils } = require('../shared/utils');
const localizer = require('i18n');
//preconfiguraciones 
let serviceTicket = require('./resources/configurations/serviceTicket.json');
let genericTicket = require('./resources/configurations/genericTicket.json');
let maintenanceTicket = require('./resources/configurations/maintenanceTicket.json');
let soporteProdServidoresTicket = require('./resources/configurations/soporteProdServidoresTicket.json');

let ppmOptions = require('./resources/configurations/ppmOptions.json');
const ticketType = {
    soporteProdServidoresTicket: 'Soporte Producción - Servidores',
    soporteProdFuncionalTicket: 'Soporte Producción - Funcionales',
    gestionPasoProdTicket: 'Preparar/Gestionar Paso a Producción',
    pasoHomoTicket: 'Paso a Homologación',
    despliegueTicket:'Despliegue',
    solicitudesVariasTicket: "Solicitudes Varias",
    qsCambioCodigo:'Cambio de Código'
    };

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const PPM_SETTINGS = 'PPM_SETTINGS';

const TICKET_DIALOG = 'TICKET_DIALOG';

//tipos de selecciones multiples
const TICKET_TYPE_CHOICE = 'ticketType';
const SERVICE_REASON_CHOICE = 'serviceReason';
const MAINTENANCE_REASON_CHOICE = 'maintenanceReason';
const IMPACT_CHOICE = 'impact';
const URGENCY_CHOICE = 'urgency';
const CATEGORY_APPLICATION_CHOICE = 'categoryApplication';
const EVENTUM_CHOICE = 'eventum';

class CreateTicketDialog extends ComponentDialog {
    constructor(userDataAccessor) {
        super(CreateTicketDialog.name);
        if (!userDataAccessor) throw new Error('CreateTicket constructor missing parameter: userDataAccessor is required.');
        
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.positiveNumValidator));
        this.addDialog(new WaterfallDialog(TICKET_DIALOG, [
            this.setupStep.bind(this),
            this.assignStep.bind(this),
            this.reasonStep.bind(this),
            this.impactStep.bind(this),
            this.urgencyStep.bind(this),
            //this.clientIdStep.bind(this),
            this.eventumStep.bind(this),
            this.numStep.bind(this),
            this.descriptionStep.bind(this),
            this.requestorNameStep.bind(this),
            this.categoryApplicationStep.bind(this),
            this.detailedDescriptionStep.bind(this),
            this.confirmStep.bind(this),
            this.resultStep.bind(this)
        ]));
    
        this.userDataAccessor = userDataAccessor;
        this.initialDialogId = TICKET_DIALOG;
    }

    async setupStep(step) {
        const options = this.optionBuilder(TICKET_TYPE_CHOICE);
        return await step.prompt(CHOICE_PROMPT, options);
    }
    async assignStep(step) {
        var ppmSettingsPre;
        switch (step.result.value){
            case ticketType.soporteProdServidoresTicket:
                ppmSettingsPre = soporteProdServidoresTicket;
                break;
            default:
                await step.context.sendActivity(`Opción actualmente no implementada.`);
                return await step.endDialog();                
        };
        step.values.ppmSettings = ppmSettingsPre;
        return await step.prompt(TEXT_PROMPT, `Escriba el nombre de la persona a la que será asignado este Ticket`);
    }

    async reasonStep(step) {
        if(typeof step.result != 'undefined')
        {
            step.values.ppmSettings.assignedTo = step.result;
        }
        //await step.context.sendActivity(`El ticket será asignado a: ${ step.values.ppmSettings.assignedTo }`);

        if(step.values.ppmSettings.requirementType)
        {
            return await step.next();
        }

        var options;
        if(step.values.ppmSettings.requirementType === 'Service')
            options = this.optionBuilder(SERVICE_REASON_CHOICE);
        if(step.values.ppmSettings.requirementType === 'Maintenance')
            options = this.optionBuilder(MAINTENANCE_REASON_CHOICE);
    
        return await step.prompt(CHOICE_PROMPT, options);
    }
    async impactStep(step) {

        if(typeof step.result != 'undefined')
        {
            step.values.ppmSettings.reason = step.result.value;
        }

        //await step.context.sendActivity(`Razón escogida ${ step.values.ppmSettings.reason }`);

        if(step.values.ppmSettings.impact)
        {
            return await step.next();
        }
        
        const options = this.optionBuilder(IMPACT_CHOICE);
        return await step.prompt(CHOICE_PROMPT, options);
    }

    async urgencyStep(step) {
        if(typeof step.result != 'undefined')
        {
            step.values.ppmSettings.impact = step.result.value;
        }

        //await step.context.sendActivity(`Nivel de impacto escogido: ${ step.values.ppmSettings.impact }`);
        
        if(step.values.ppmSettings.urgency)
        {
            return await step.next();
        }
        const options = this.optionBuilder(URGENCY_CHOICE);
        return await step.prompt(CHOICE_PROMPT, options);
    }

    async eventumStep(step) {
        if(typeof step.result != 'undefined'){
            step.values.ppmSettings.urgency = step.result.value;
        }
        //await step.context.sendActivity(`Nivel de urgencia escogida: ${ step.values.ppmSettings.urgency }`);

        const options = this.optionBuilder(EVENTUM_CHOICE);
        return await step.prompt(CHOICE_PROMPT, options);
    }
    async numStep(step) {
        step.values.descriptionBuilder = `${step.values.ppmSettings.clientId} - ${step.result.value}-` ;
        const options = { prompt: `Ingrese el numero de ${ step.result.value } `, retryPrompt: 'El valor debe ser mayor a 0.' };
        return await step.prompt(NUMBER_PROMPT, options);
    }
    async descriptionStep(step) {
        step.values.descriptionBuilder = step.values.descriptionBuilder + step.result;
        return await step.prompt(TEXT_PROMPT, `Ingrese descripcion representativa de la solicitud`);
    }
    async requestorNameStep(step) {
        step.values.ppmSettings.description = `${step.values.descriptionBuilder} - ${ step.result } `;
        await step.context.sendActivity(`La descripcion de la solicitud es la siguiente: ${ step.values.ppmSettings.description }`);

        return await step.prompt(TEXT_PROMPT, `Ingrese el nombre de quien lo solicita`);
    }
    async categoryApplicationStep(step) {
        step.values.ppmSettings.requestorName = step.result;

        //await step.context.sendActivity(`La persona que lo solicita es: ${ step.values.ppmSettings.requestorName }`);

        const options = this.optionBuilder(CATEGORY_APPLICATION_CHOICE);
        return await step.prompt(CHOICE_PROMPT, options);
    }
    async detailedDescriptionStep(step) {
        step.values.ppmSettings.categoryApplication = step.result.value;
        return await step.prompt(TEXT_PROMPT, `Ingrese descripcion detallada de la solicitud`);
    }
    
    async confirmStep(step) {
        step.values.ppmSettings.detailedDescription = step.result;

        const ppmSettings = step.values.ppmSettings;

        
        let msg = `El siguiente Ticket será creado:\n
        Org Unit: ${ ppmSettings.orgUnit }\n
        WBS: ${ ppmSettings.wbs }\n
        Assigned To: ${ ppmSettings.assignedTo }\n
        Requirement Type: ${ ppmSettings.requirementType }\n
        Reason: ${ ppmSettings.reason } \n
        Impact: ${ ppmSettings.impact } \n
        Urgency: ${ ppmSettings.urgency } \n
        Description: ${ ppmSettings.description } \n
        Requestor Name: ${ ppmSettings.requestorName } \n
        Category/ApplicationStep: ${ ppmSettings.categoryApplication } \n
        Location: ${ ppmSettings.location } \n
        Detailed Description: ${ ppmSettings.detailedDescription } \n`;

        await step.context.sendActivity(msg);


        const options = this.optionBuilder(CONFIRM_PROMPT);
        return await step.prompt(CONFIRM_PROMPT, options);
    }
    async resultStep(step) {

        if (step.result) 
        {
            step.context.sendActivity(`Su ticket se esta creando ... `);

            const nroSolicitud = await getData(step.values);
            await step.context.sendActivity(`La id del ticket creado es: ${ nroSolicitud }`);
        }
        else
        {
            await step.context.sendActivity(`La creación del ticket a sido cancelada.`);
        }

        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;
        await step.context.sendActivity(localizer.gettext(locale, 'readyPrompt'));
        await Utils.showMainMenu(step.context, locale);
        return await step.endDialog();
    }

    async positiveNumValidator(promptContext) {
        return promptContext.recognized.succeeded && promptContext.recognized.value > 0;
    }
    optionBuilder(options) {
        
        //TODO migrar a locale
        //const userData = this.userDataAccessor.get(step.context);
        //const locale = userData.locale;
        //const format = localizer.gettext(locale, 'readyPrompt');

        switch(options){
            case TICKET_TYPE_CHOICE:
                return {
                    prompt: 'Selecciona tipo de ticket: ',
                    retryPrompt: 'Selecciona tipo de ticket valido: ',
                    choices: ppmOptions.ticketType
                };
            case SERVICE_REASON_CHOICE:
                return {
                    prompt: 'Selecciona la razon: ',
                    retryPrompt: 'Selecciona una razon valida: ',
                    choices: ppmOptions.serviceReason
                };
            case MAINTENANCE_REASON_CHOICE:
                return {
                    prompt: 'Selecciona la razon: ',
                    retryPrompt: 'Selecciona una razon valida: ',
                    choices: ppmOptions.maintenanceReason
                };
            case IMPACT_CHOICE:
                return {
                    prompt: 'Selecciona el impacto: ',
                    retryPrompt: 'Selecciona un impacto valida: ',
                    choices: ppmOptions.impact
                };
            case URGENCY_CHOICE:
                return {
                    prompt: 'Selecciona la urgencia: ',
                    retryPrompt: 'Selecciona una urgencia valida: ',
                    choices: ppmOptions.urgency
                };
            case CATEGORY_APPLICATION_CHOICE:
                return {
                    prompt: 'Selecciona una categoria de la aplicacion: ',
                    retryPrompt: 'Selecciona una categoria valida: ',
                    choices: ppmOptions.categoryApplication
                };
            case EVENTUM_CHOICE:
                    return {
                        prompt: 'Es esta solicitud un Eventum?',
                        retryPrompt: 'Selecciona una opcion valida: ',
                        choices: ppmOptions.eventum
                    };
            case CONFIRM_PROMPT:
                return {
                    prompt: 'Es esto correcto?',
                    retryPrompt: 'Entregue una respuesta valida'
                };
        }
    }
}

const getData = async (values) =>  {
    try {
      const response = await axios.post(url, { 
            "ticketPPM" : values.ppmSettings, 
            "auth": {
              mail: "bastian.alegria@softtek.com",
              encryptedPw: "DG7z9MVyWq5sxJcrdbtN6g=="
          }
        });
      //const ticket = await automation.automationTest(ppmSettings);
      const data = response.data;
      console.log(data);
      const content = JSON.parse(data.nroSolicitud);
      return content;
    } catch (error) {
      console.log(error);
    }
  };
exports.CreateTicketDialog = CreateTicketDialog;


