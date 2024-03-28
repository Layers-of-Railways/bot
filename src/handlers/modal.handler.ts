import { Events, ModalBuilder, ModalComponentData, ModalSubmitInteraction } from 'discord.js';
import { Handler } from '..';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modalMap = new Map<string, Modal<any>>();

export class Modal<ArgsType> {
    readonly id: string;
    onSubmit: (interaction: ModalSubmitInteraction, args: ArgsType) => unknown;
    constructor(
        id: string,
        onSubmit: (
            interaction: ModalSubmitInteraction,
            args: ArgsType
        ) => unknown
    ) {
        this.id = id;
        if (modalMap.has(id)) console.error(`Modal ${id} is already defined`);
        modalMap.set(id, this);
        this.onSubmit = onSubmit;
    }

    modal(
        data: Omit<ModalComponentData, 'customId' | 'type'>,
        args: ArgsType
    ): ModalBuilder {
        return new ModalBuilder({
            ...data,
            customId: JSON.stringify({ id: this.id, args }),
        });
    }
}

export const modalHandler: Handler = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isModalSubmit()) return;
        console.log(
            'recieved modal submit with custom id ',
            interaction.customId
        );
        const data = JSON.parse(interaction.customId);
        const args = data.args;
        if (!data.id) return;
        if (!modalMap.has(data.id)) return;
        const modal = modalMap.get(data.id);
        if (!modal) return;

        if (!modal.onSubmit) return;
        try {
            modal.onSubmit(interaction, args);
        } catch {
            interaction.reply('error while executing');
        }
    });
};
