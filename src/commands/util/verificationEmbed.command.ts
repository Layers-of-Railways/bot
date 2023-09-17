import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../../handlers/command.handler';
import { Button } from '../../handlers/button.handler';
import { string } from 'valibot';

const verifyButtonSchema = string();

const verifyButton = new Button(
    'verify',
    verifyButtonSchema,
    (interaction, data) => {
        interaction.reply(data);
    }
);

export const verificationEmbedCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('post-verification-embed')
        .setDescription('Post the verification embed')
        .addBooleanOption((option) =>
            option
                .setName('disabled')
                .setDescription('Should the button be disabled?')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.guild || !interaction.channel) return;

        let disabled = false;
        let embedString =
            'To join the server you must verify yourself please click the button below to get started.';
        if (interaction.options.get('disabled', false)?.value == true) {
            disabled = true;
            embedString = 'Verification is temporarily disabled.';
        }

        const embed = new EmbedBuilder()
            .setTitle('Verification')
            .setDescription(embedString)
            .setFooter({
                text: 'If you have any questions, please contact a staff member.',
            })
            .setColor(Colors.Green);

        const button = verifyButton.button(
            {
                style: ButtonStyle.Success,
                label: 'Verify',
            },
            interaction.user.username
        );

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            button
        );

        await interaction.channel.send({
            embeds: [embed],
            components: [actionRow],
        });

        await interaction.reply({ content: 'Done!', ephemeral: true });
    },
};
