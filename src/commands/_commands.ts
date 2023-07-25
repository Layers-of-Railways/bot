import { Command } from "../handlers/command.handler"
import { sayCommand } from "./say.command"

export const commands: Command[] = [
    sayCommand
]

export default commands