import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../handlers/command.handler';

export const sayCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something through the bot')
    .addStringOption(option =>
      option
        .setName('content')
        .setDescription('Just content?')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;


    const content = interaction.options.get('content', true).value as string
    await interaction.deferReply({ ephemeral: true });
    const message = await interaction.channel.send(content);
    await interaction.editReply('I said what you said!');

    if (process.env.SAY_LOGS_CHANNEL) {
      const logsChannel = await interaction.guild.channels.fetch(
        process.env.SAY_LOGS_CHANNEL
      );

      if (!logsChannel?.isTextBased()) return;

      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Say command used')
            .setDescription(content)
            .setAuthor({
              name: interaction.user.tag,
              iconURL: interaction.user.avatarURL() ?? undefined,
            })
            .setURL(message.url),
        ],
      });
    }
  }
}
