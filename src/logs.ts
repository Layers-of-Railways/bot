import { EmbedBuilder } from 'discord.js';

// log providers
import { readMcLogs } from './logproviders/mclogs';
import { read0x0 } from './logproviders/0x0';
import { readPasteGG } from './logproviders/pastegg';
import { readHastebin } from './logproviders/haste';
import { COLORS } from './constants';

type Analyzer = (text: string) => Promise<Array<string> | null>;
type LogProvider = (text: string) => Promise<null | string>;

const optifineAnalyzer: Analyzer = async (text) => {
  const matchesOptifine = text.match(/f_174747_/);
  if (matchesOptifine) {
    return [
      'Incompatible with OptiFine',
      "OptiFine breaks Steam 'n' Rails and is Incompatible\n\nCheck `/tag optifine` for more info & alternatives you can use.",
    ];
  }
  return null;
};

const versionAnalyzer: Analyzer = async (text) => {
  const matchesWrongVersions =
    text.match(/Minecraft Version: 1.19.3/) ||
    text.match(/Minecraft Version: 1.19.4/);
  if (matchesWrongVersions) {
    return [
      'Incompatible with that version of Minecraft',
      "Steam 'n' Rails is currently only compatible with MC 1.18.2 and 1.19.2.",
    ];
  }
  return null;
};

const modernFixAnalyzer: Analyzer = async (text) => {
  const matchesWrongVersions = text.match(/modernfix/);
  if (matchesWrongVersions) {
    return [
      'Incompatible with your version of ModernFix',
      "Steam 'n' Rails is only compatible with the most recent version of ModernFix. Please update ModernFix.",
    ];
  }
  return null;
};

const analyzers: Analyzer[] = [
  optifineAnalyzer,
  versionAnalyzer,
  modernFixAnalyzer,
];

const providers: LogProvider[] = [
  readMcLogs,
  read0x0,
  readPasteGG,
  readHastebin,
];

export async function parseLog(s: string): Promise<EmbedBuilder | null> {
  if (/(https?:\/\/)?pastebin\.com\/(raw\/)?[^/\s]{8}/g.test(s)) {
    const embed = new EmbedBuilder()
      .setTitle('pastebin.com detected')
      .setDescription('Please use https://mclo.gs or another paste provider')
      .setColor(COLORS.red);
    return embed;
  }

  let log = '';
  for (const i in providers) {
    const provider = providers[i];
    const res = await provider(s);
    if (res) {
      log = res;
      break;
    } else {
      continue;
    }
  }
  if (!log) return null;
  const embed = new EmbedBuilder().setTitle('Log analysis');

  let thereWasAnIssue = false;
  for (const i in analyzers) {
    const Analyzer = analyzers[i];
    const out = await Analyzer(log);
    if (out) {
      embed.addFields({ name: out[0], value: out[1] });
      thereWasAnIssue = true;
    }
  }

  if (thereWasAnIssue) {
    embed.setColor(COLORS.red);
    return embed;
  } else {
    embed.setColor(COLORS.green);
    embed.addFields({
      name: 'Analyze failed',
      value: 'No issues found automatically',
    });

    return embed;
  }
}
