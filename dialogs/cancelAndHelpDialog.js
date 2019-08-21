const { ComponentDialog } = require('botbuilder-dialogs');

class CancelAndHelpDialog extends ComponentDialog {

    async onBeginDialog(innerDc, options) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }

        return await super.onBeginDialog(innerDc, options);
    }
    
    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    

    async interrupt(innerDc) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();
    
            switch (text) {
            case 'wat':
            case 'help':
            case '?':
                const helpMessageText = 'Comandos disponibles durante el dialogo de creación';
                await innerDc.context.sendActivity(helpMessageText, helpMessageText);
                const helpDescriptionText = 'cancel/quit - aborta la creación del ticket';
                await innerDc.context.sendActivity(helpDescriptionText, helpDescriptionText);
                return;

            case 'cancel':
            case 'quit':
                const cancelMessageText = 'Cancelling...';
                await innerDc.context.sendActivity(cancelMessageText, cancelMessageText);
                return await innerDc.cancelAllDialogs();
            }
        }
    }
}

module.exports.CancelAndHelpDialog = CancelAndHelpDialog;