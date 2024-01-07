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
    readonly id: string;
    onPress: (interaction: ButtonInteraction, args: ArgsType) => unknown;
    constructor(
        id: string,
        onPress: (interaction: ButtonInteraction, args: ArgsType) => unknown
    ) {
        this.id = id;
        if (buttonMap.has(id)) console.error(`Button ${id} is already defined`);
        buttonMap.set(id, this);
        this.onPress = onPress;
    }

    button(
        data: Omit<InteractionButtonComponentData, 'customId' | 'type'>,
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

        if (!button.onPress) return;
        try {
            button.onPress(interaction, args);
        } catch {
            interaction.reply('error while executing');
        }
    });
};
