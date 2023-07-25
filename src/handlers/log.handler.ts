import { EmbedBuilder, Events } from 'discord.js';

// log providers
import logProviders from '../logProviders/_logProviders'
import logAnalyzers from '../logAnalyzers/_logAnalyzers';

import { Handler } from '..';

export type LogAnalyzer = (url: string) => Promise<null | { name: string, value: string }>;
export interface LogProvider {
  hostnames: string[]
  parse: (url: string) => Promise<void | string>
}

const hostnameMap = new Map<string, (text: string) => Promise<void | string>>()

for (const provider of logProviders) {
  provider.hostnames.forEach(hostname => hostnameMap.set(hostname, provider.parse))
}

async function parseWebLog(text: string): Promise<string | void> {
  const reg = text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/)
  if (!reg) return
  const url = reg[0]
  const hostname = url.split("/")[2]
  if (!hostnameMap.has(hostname)) return;
  return hostnameMap.get(hostname)!(url)
}

async function findIssues(log: string) {
  const issues: { name: string, value: string }[] = []

  for (const analyzer of logAnalyzers) {
    const issue = await analyzer(log)
    if (issue) issues.push(issue)
  }

  return issues
}



export const logHandler: Handler = (client) => {
  client.on(Events.MessageCreate, async (message) => {
    try {
      if (message.channel.partial) await message.channel.fetch();
      if (message.author.partial) await message.author.fetch();

      const attachment = message.attachments.find(attachment => attachment.contentType == "text/plain; charset=utf-8")

      if (!message.content && !attachment) return;
      if (!message.channel.isTextBased()) return;

      if (message.author === client.user) return;

      const log = attachment
        ? await (await fetch(attachment.url)).text()
        : await parseWebLog(message.content);


      if (!log) return

      const regexPasses = [
        /---- Minecraft Crash Report ----/, // Forge Crash report
        /\n\\|[\\s\\d]+\\| Minecraft\\s+\\| minecraft\\s+\\| (\\S+).+\n/, // Quilt mod table
        /: Loading Minecraft (\\S+)/, // Fabric, Quilt
        /--fml.mcVersion, ([^\\s,]+)/, // Forge
        /--version, ([^,]+),/, // ATLauncher
        / --version (\\S+) / // MMC, Prism, PolyMC
      ]

      if (!regexPasses.find(reg => log.match(reg))) return

      const issues = await findIssues(log)

      const embed = new EmbedBuilder()
        .setTitle("Log analysis")
        .setDescription(`${issues.length || "No"} issue${issues.length == 1 ? "" : "s"} found automatically`)
        .setFields(...issues)
        .setColor(issues.length ? "Red" : "Green")

      if (log != null) {
        message.reply({ embeds: [embed] });
        return;
      }
    } catch (error) {
      console.error('Unhandled exception on MessageCreate', error);
    }
  });
}
