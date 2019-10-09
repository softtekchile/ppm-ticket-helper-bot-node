const { CardFactory } = require('botbuilder');
const localizer = require('i18n');


class Utils{

    /**
     * Get a Hero card
     * @param {Array} buttons A list of suggested text strings.
     * @param {string} cardTitle Title of the card.
     */
    static getHeroCard(buttons, cardTitle) {
        const cardActions = [];

        buttons.forEach(element => {
            cardActions.push({
                value: element,
                type: 'imBack',
                title: element
            });
        });

        const heroCard = CardFactory.heroCard(
            cardTitle,
            [],
            CardFactory.actions(cardActions));

        return { attachments: [heroCard] };
    }

    /**
     * Helper function to display main menu using user's locale.
     *
     * @param {TurnContext} context The turn context for the current turn of conversation.
     * @param {String} locale user's locale.
     */
    static async showMainMenu(context, locale) {
        const hints = localizer.gettext(locale, 'hints');
        const buttons = [];

        Object.values(hints).forEach(value => {
            buttons.push(value);
        });

        await context.sendActivity(this.getHeroCard(buttons));
    }

    static getChoiceNo(locale, titleKey, moreSynonymsKey) {
        const title = localizer.gettext(locale, titleKey);
        let noSynonyms = localizer.gettext(locale, 'synonyms.no');

        if (moreSynonymsKey) {
            const moreSynonyms = localizer.gettext(locale, moreSynonymsKey);
            noSynonyms = noSynonyms.concat(moreSynonyms);
        }

        return {
            value: 'no',
            action: {
                type: 'imBack',
                title: title,
                value: title
            },
            synonyms: noSynonyms
        };
    }

    static getChoiceYes(locale, titleKey, moreSynonymsKey) {
        const title = localizer.gettext(locale, titleKey);
        let yesSynonyms = localizer.gettext(locale, 'synonyms.yes');

        if (moreSynonymsKey) {
            const moreSynonyms = localizer.gettext(locale, moreSynonymsKey);
            yesSynonyms = yesSynonyms.concat(moreSynonyms);
        }

        return {
            value: 'yes',
            action: {
                type: 'imBack',
                title: title,
                value: title
            },
            synonyms: yesSynonyms
        };
    }
}

/**
 * @type {Utils}
 */
exports.Utils = Utils;