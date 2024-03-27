import { Command } from '../handlers/command.handler';
import { listWarningsCommand } from './moderation/listwarnings.command';
import { migrateWarningsCommand } from './moderation/migrate_warnings.command';
import { sayCommand } from './util/say.command';
import { tagCommand, tagCommandTextBased } from './util/tag.command';

export const commands: Command[] = [sayCommand, tagCommand];

if (process.env.NODE_ENV !== 'development') {
    commands.push(migrateWarningsCommand, listWarningsCommand);
}

export default commands;

// Text commands start here
export const textCommands = [tagCommandTextBased];
