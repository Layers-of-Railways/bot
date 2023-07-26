import { EmbedBuilder } from 'discord.js';

// log providers
import { readMcLogs } from '../logproviders/mclogs';
import { read0x0 } from '../logproviders/0x0';
import { readPasteGG } from '../logproviders/pastegg';
import { readHastebin } from '../logproviders/haste';
import { COLORS } from '../constants';

type Analyzer = (text: string) => Promise<Array<string> | null>;
type LogProvider = (text: string) => Promise<null | string>;

const minecraftVersionAnalyser: Analyzer = async (text) => {
  const minecraftVersionRegex1 =
    /\n\|[\s\d]+\| Minecraft\s+\| minecraft\s+\| (\S+).+\n/;
  const minecraftVersionRegex2 = /: Loading Minecraft (\S+)/;
  const minecraftVersionRegex3 = /--fml.mcVersion, ([^\s,]+)/;
  const minecraftVersionRegex4 = /--version, ([^,]+),/;
  const minecraftVersionRegex5 = / --version (\\S+) /;
  const minecraftVersionRegex6 = /Minecraft Version: (.+)/;

  const minecraftVersionMatch1 = text.match(minecraftVersionRegex1);
  const minecraftVersionMatch2 = text.match(minecraftVersionRegex2);
  const minecraftVersionMatch3 = text.match(minecraftVersionRegex3);
  const minecraftVersionMatch4 = text.match(minecraftVersionRegex4);
  const minecraftVersionMatch5 = text.match(minecraftVersionRegex5);
  const minecraftVersionMatch6 = text.match(minecraftVersionRegex6);

  if (minecraftVersionMatch1) {
    const version = minecraftVersionMatch1[1].toString();
    return ['Minecraft Version', version];
  } else if (minecraftVersionMatch2) {
    const version = minecraftVersionMatch2[1].toString();
    return ['Minecraft Version', version];
  } else if (minecraftVersionMatch3) {
    const version = minecraftVersionMatch3[1].toString();
    return ['Minecraft Version', version];
  } else if (minecraftVersionMatch4) {
    const version = minecraftVersionMatch4[1].toString();
    return ['Minecraft Version', version];
  } else if (minecraftVersionMatch5) {
    const version = minecraftVersionMatch5[1].toString();
    return ['Minecraft Version', version];
  } else if (minecraftVersionMatch6) {
    const version = minecraftVersionMatch6[1].toString();
    return ['Minecraft Version', version];
  }

  return null;
};

const javaVersionAnalyser1: Analyzer = async (text) => {
  const javaVersionRegex = /Java Version: (.+)/;
  const javaVersionMatch = text.match(javaVersionRegex);

  if (javaVersionMatch) {
    const version = javaVersionMatch[1].toString().split(',');
    return ['Java Version', `${version[0]}`];
  }
  return null;
};

const javaVersionAnalyser2: Analyzer = async (text) => {
  const javaVersionRegex = /Java is version (.+?),/;
  const javaVersionMatch = text.match(javaVersionRegex);

  if (javaVersionMatch) {
    const version = javaVersionMatch[1].toString();
    return ['Java Version', `${version}\n`];
  }
  return null;
};

const javaArgumentsAnalyzer: Analyzer = async (text) => {
  const javaArgumentsRegex = /Java Arguments:\s+(\[[^\]]+\])/;
  const javaArgumentsMatch = text.match(javaArgumentsRegex);

  if (javaArgumentsMatch) {
    const javaargs = javaArgumentsMatch[1].toString();
    return ['Java Arguments', `${javaargs}\n`];
  }
  return null;
};

const loaderAnalyser: Analyzer = async (text) => {
  let loader;
  let loaderVersion;

  const quiltLoaderRegex =
    /\n\|[\s\d]+\| Quilt Loader\s+\| quilt_loader\s+\| (\S+).+\n/;
  const quiltLoaderRegex2 = /: Loading .+ with Quilt Loader (\S+)/;
  const fabricLoaderRegex = /: Loading .+ with Fabric Loader (\S+)/;
  const forgeLoaderRegex1 = /--fml.forgeVersion, ([^\s,]+)/;
  const forgeLoaderRegex2 = /MinecraftForge v([^\\s,]+) Initialized/;

  const quiltLoaderMatch1 = text.match(quiltLoaderRegex);
  const quiltLoaderMatch2 = text.match(quiltLoaderRegex2);
  const fabricLoaderMatch = text.match(fabricLoaderRegex);
  const forgeLoaderMatch1 = text.match(forgeLoaderRegex1);
  const forgeLoaderMatch2 = text.match(forgeLoaderRegex2);

  if (quiltLoaderMatch1) {
    loader = 'Quilt';
    loaderVersion = quiltLoaderMatch1[1];
    return ['Loader', `${loader} (${loaderVersion})`];
  } else if (quiltLoaderMatch2) {
    loader = 'Quilt';
    loaderVersion = quiltLoaderMatch2[1];
    return ['Loader', `${loader} (${loaderVersion})`];
  } else if (fabricLoaderMatch) {
    loader = 'Fabric';
    loaderVersion = fabricLoaderMatch[1];
    return ['Loader', `${loader} (${loaderVersion})`];
  } else if (forgeLoaderMatch1) {
    loader = 'Forge';
    loaderVersion = forgeLoaderMatch1[1];
    return ['Loader', `${loader} (${loaderVersion})`];
  } else if (forgeLoaderMatch2) {
    loader = 'Forge';
    loaderVersion = forgeLoaderMatch2[1];
    return ['Loader', `${loader} (${loaderVersion})`];
  }

  return null;
};

const versionAnalyzers: Analyzer[] = [
  minecraftVersionAnalyser, // Matches MC version
  javaVersionAnalyser1, // Matches Java version
  javaVersionAnalyser2, // Matches Java version
  javaArgumentsAnalyzer, // Matches Java arguments
  loaderAnalyser, // Matches loader
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

  let log_type;

  if (log.match(/Minecraft Crash Report/)) {
    log_type = 'Crash Report';
  } else {
    log_type = 'Log File';
  }

  if (!log) return null;
  const embed = new EmbedBuilder()
    .setTitle(log_type)
    .setDescription('__Enviroment Info__');

  for (const i in versionAnalyzers) {
    const Analyzer = versionAnalyzers[i];
    const out = await Analyzer(log);
    if (out) {
      embed.addFields({ name: out[0], value: `\`${out[1]}\`` });
    }
  }

  embed.setColor(COLORS.green);
  // embed.addFields({
  //   name: 'Analyze failed',
  //   value: 'No issues found automatically',
  // });

  return embed;
}
