import { Analyzer } from '../handlers/log.handler';

export const getMinecraftVersion = (log: string) => {
    const minecraftVerionRegexes = [
        /\n\|[\s\d]+\| Minecraft\s+\| minecraft\s+\| (\S+).+\n/,
        /: Loading Minecraft (\S+)/,
        /--fml.mcVersion, ([^\s,]+)/,
        /--version, ([^,]+),/,
        / --version (\\S+) /,
        /Minecraft Version: (.+)/,
    ];

    for (const regex of minecraftVerionRegexes) {
        const regRes = log.match(regex);
        if (!regRes) continue;
        return regRes[1].toString();
    }
};

const minecraftVersionAnalyser: Analyzer = async (log) => {
    const version = getMinecraftVersion(log);
    if (!version) return null;
    return {
        name: 'Minecraft Version',
        value: '`' + version + '`',
    };
};

export const getJavaVersion = (log: string) => {
    const javaVersionRegexes = [/Java Version: (.+)/, /Java is version (.+?),/];
    for (const regex of javaVersionRegexes) {
        const regRes = log.match(regex);
        if (!regRes) continue;
        const version = regRes[1].toString();
        return version;
    }
};

export const javaVersionAnalyzer: Analyzer = async (log) => {
    const version = getJavaVersion(log);
    if (!version) return null;
    return {
        name: 'Java Version',
        value: '`' + version + '`',
    };
};

export const javaArgumentsAnalyzer: Analyzer = async (text) => {
    const javaArgumentsRegex = /Java Arguments:\s+(\[[^\]]+\])/;
    const javaArgumentsMatch = text.match(javaArgumentsRegex);

    if (javaArgumentsMatch) {
        const javaargs = javaArgumentsMatch[1].toString();
        return {
            name: 'Java Arguments',
            value: `\`\`\`${javaargs}\`\`\``,
        };
    }
    return null;
};

export type Loader = 'Quilt' | 'Fabric' | 'Forge';

export function getLoader(
    log: string
): { loader: Loader; version: string } | undefined {
    const loaderRegexes = new Map<Loader, RegExp[]>();
    loaderRegexes.set('Quilt', [
        /\n\|[\s\d]+\| Quilt Loader\s+\| quilt_loader\s+\| (\S+).+\n/,
        /: Loading .+ with Quilt Loader (\S+)/,
    ]);
    loaderRegexes.set('Fabric', [/: Loading .+ with Fabric Loader (\S+)/]);
    loaderRegexes.set('Forge', [
        /--fml.forgeVersion, ([^\s,]+)/,
        /MinecraftForge v([^\\s,]+) Initialized/,
    ]);

    for (const loader of loaderRegexes.keys()) {
        const regexes = loaderRegexes.get(loader);
        if (!regexes) continue;
        for (const regex of regexes) {
            const regRes = log.match(regex);
            if (!regRes) continue;
            const version = regRes[1].toString();
            return {
                loader: loader,
                version: version,
            };
        }
    }
}

const loaderAnalyser: Analyzer = async (log) => {
    const loaderData = getLoader(log);
    if (!loaderData) return null;
    const { loader, version } = loaderData;
    return {
        name: 'Loader',
        value: `\`${loader} (${version})\``,
    };
};

export const analyzers: Analyzer[] = [
    minecraftVersionAnalyser,
    javaVersionAnalyzer,
    loaderAnalyser,
];
