import { Command } from "../handlers/command.handler"
import { sayCommand } from "./say.command"
import { tagCommand } from "./tag.command"

export const commands: Command[] = [
    sayCommand,
    tagCommand
]

export default commands