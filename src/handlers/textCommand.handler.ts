import { EmbedBuilder, Events } from 'discord.js';
import { Handler } from '..';
import { textCommands } from '../commands/_commands';

const textCommandHandler: Handler = (client) => {
    client.on(Events.MessageCreate, async (event) => {
        if (!event.content.startsWith('!')) return; // make sure that the interaction came from a command
        try {
            for (const command of textCommands) command(event); // try execute the command
        } catch (error) {
            // in case of an error
            await event.channel.send({
                // send a followup to the interaction
                embeds: [
                    new EmbedBuilder({
                        color: 0xff2222,
                        title: 'Internal error',
                    }),
                ],
            });
            return;
        }
    });
};

export default textCommandHandler;
