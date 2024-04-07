import { Command } from '../handlers/command.handler';
import { sayCommand } from './util/say.command';
import { tagCommand, tagCommandTextBased } from './util/tag.command';

export const commands: Command[] = [sayCommand, tagCommand];

export default commands;

// Text commands start here
export const textCommands = [tagCommandTextBased];
