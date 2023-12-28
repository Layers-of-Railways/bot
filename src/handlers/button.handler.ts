import {
    ButtonBuilder,
    ButtonInteraction,
    Events,
    Interaction,
    InteractionButtonComponentData,
} from 'discord.js';
import { Handler } from '..';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buttonMap = new Map<string, Button<any>>();

export class Button<ArgsType> {
    id: string;
    _onPress?: (interaction: ButtonInteraction, args: ArgsType) => unknown;
    constructor(
        id: string,
        onPress: (interaction: ButtonInteraction, args: ArgsType) => unknown
    ) {
        this.id = id;
        if (buttonMap.has(id)) console.error(`Button ${id} is already defined`);
        buttonMap.set(id, this);
        this._onPress = onPress;
    }

    button(
        data: Partial<InteractionButtonComponentData>,
        args: ArgsType
    ): ButtonBuilder {
        const button = new ButtonBuilder({
            ...data,
            customId: JSON.stringify({ id: this.id, args }),
        });
        return button;
    }
}

export const buttonHandler: Handler = (client) => {
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        const data = JSON.parse(interaction.customId);
        const args = data.args;
        if (!data.id) return;
        if (!buttonMap.has(data.id)) return;
        const button = buttonMap.get(data.id);
        if (!button) return;

        if (!button._onPress) return;
        try {
            button._onPress(interaction, args);
        } catch {
            interaction.reply('error while executing');
        }
    });
};
