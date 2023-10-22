import {
    ButtonBuilder,
    ButtonInteraction,
    Events,
    InteractionButtonComponentData,
} from 'discord.js';
import { Handler } from '..';
import { BaseSchema, Output } from 'valibot';
import { error } from 'console';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buttonMap = new Map<string, Button<any>>();

export class Button<ArgsType extends BaseSchema> {
    id: string;
    args?: ArgsType;
    _onPress?: (interaction: ButtonInteraction, args: ArgsType) => unknown;
    constructor(
        id: string,
        args: ArgsType,
        onPress: (
            interaction: ButtonInteraction,
            args: Output<ArgsType>
        ) => unknown
    ) {
        this.id = id;
        if (buttonMap.has(id)) console.error(`Button ${id} is already defined`);
        buttonMap.set(id, this);
        this._onPress = onPress;
        this.args = args;
    }

    button(
        data: Partial<InteractionButtonComponentData>,
        args: Output<ArgsType>
    ): ButtonBuilder {
        const button = new ButtonBuilder({
            ...data,
            customId: JSON.stringify({ id: this.id, args }),
        });
        return button;
    }
}

export const buttonHandler: Handler = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;
        const data = JSON.parse(interaction.customId);
        const args = data.args;
        if (!data.id) return;
        if (!buttonMap.has(data.id)) return;
        const button = buttonMap.get(data.id);
        if (!button) return;
        if (!button.args) throw error('No args set in button');
        const parsedArgs = button.args.parse ? button.args.parse(args) : null;
        if (!button._onPress) return;
        button._onPress(interaction, parsedArgs);
    });
};
