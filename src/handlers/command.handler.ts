import { Handler } from "..";
import dotenv from 'dotenv'
import { REST, Routes, SlashCommandBuilder, CommandInteraction, Collection, EmbedBuilder, RESTGetAPIOAuth2CurrentApplicationResult } from "discord.js";
import * as color from 'colorette'
import commands from "../commands/_commands";

dotenv.config()


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// LOAD COMMANDS AND UPLOAD TO DISCORD //

export interface Command { // create an interface accessible from another files used to create commands
    data: SlashCommandBuilder,
    execute: (interaction: CommandInteraction) => unknown
}

const commandCollection = new Collection<string, Command>(commands.map(command => [command.data.name, command]))

console.log() // prints an empty line

console.log(color.blueBright(`Loaded ${commands.length} command${commands.length == 1 ? "" : "s"}:`))

for (const index in commands) {
    const command = commands[index]
    console.log(`|| ${color.whiteBright(parseInt(index) + 1 + ". " + command.data.name)}:\n||     → ${command.data.description}`)
}


console.log() // prints an empty line

// taken from discord.js docs and transformed a bit
export async function reloadGlobalSlashCommands() {
    try {
        console.log(color.bgYellowBright(`Started refreshing ${commands.length} application (/) commands.`));
        console.time(color.yellowBright("Reloading global commands"))

        // The put method is used to fully refresh all commands with the current set

        const { id: appId } = (await rest.get(
            Routes.oauth2CurrentApplication()
        )) as RESTGetAPIOAuth2CurrentApplicationResult;

        await rest.put(
            Routes.applicationCommands(appId),
            { body: commands.map(commandList => commandList.data.toJSON()) },
        );

        console.log(`Successfully reloaded global application (/) commands.`);
        console.timeEnd(color.yellowBright("Reloading global commands"))
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
}


const commandHandler: Handler = (client) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return                          // make sure that the interaction came from a command
        if (!commandCollection.has(interaction.commandName)) return   // and that the command exist on this app

        try {
            await commandCollection.get(interaction.commandName)!.execute(interaction) // try execute the command
        } catch (error) {                   // in case of an error
            await interaction.followUp({    // send a followup to the interaction 
                embeds: [
                    new EmbedBuilder({
                        color: 0xff2222,
                        title: "Internal error"
                    })
                ]
            })
            return;
        }
    })
}

export default commandHandler