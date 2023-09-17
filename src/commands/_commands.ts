import { Command } from '../handlers/command.handler';
import { deleteWarningCommand } from './moderation/deletewarning.command';
import { listWarningsCommand } from './moderation/listwarnings.command';
import { warnCommand } from './moderation/warn.command';
import { sayCommand } from './util/say.command';
import { tagCommand } from './util/tag.command';
import { verificationEmbedCommand } from './util/verificationEmbed.command';

export const commands: Command[] = [
    sayCommand,
    tagCommand,
    verificationEmbedCommand,
];

if (process.env.NODE_ENV !== 'development') {
    commands.push(warnCommand, deleteWarningCommand, listWarningsCommand);
}

export default commands;
