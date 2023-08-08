export interface Mod {
    id: string;
    version: string;
}

export type Loader = 'Quilt' | 'Fabric' | 'Forge';

const getMinecraftVersion = (log: string) => {
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

const getJavaVersion = (log: string) => {
    const javaVersionRegexes = [/Java Version: (.+)/, /Java is version (.+?),/];
    for (const regex of javaVersionRegexes) {
        const regRes = log.match(regex);
        if (!regRes) continue;
        const version = regRes[1].toString();
        return version;
    }
};

function getLoader(log: string): { name: Loader; version: string } | undefined {
    const loaderRegexes = new Map<Loader, RegExp[]>();
    loaderRegexes.set('Quilt', [
        /\n\|[\s\d]+\| Quilt Loader\s+\| quilt_loader\s+\| (\S+).+\n/,
        /: Loading .+ with Quilt Loader (\S+)/,
    ]);
    loaderRegexes.set('Fabric', [/: Loading .+ with Fabric Loader (\S+)/]);
    loaderRegexes.set('Forge', [
        /--fml.forgeVersion, ([^\s,]+)/,
        /MinecraftForge v([^\\s,]+) Initialized/,
        /FML: ([^\s,]+)/,
    ]);

    for (const loader of loaderRegexes.keys()) {
        const regexes = loaderRegexes.get(loader);
        if (!regexes) continue;
        for (const regex of regexes) {
            const regRes = log.match(regex);
            if (!regRes) continue;
            const version = regRes[1].toString();
            return {
                name: loader,
                version: version,
            };
        }
    }
}

export class Log {
    readonly warnCount: number;
    readonly errorCount: number;
    readonly loader?: { name: Loader; version: string };
    readonly gameVersion?: string;
    readonly javaVersion?: string;
    readonly mods?: Map<string, string>;
    readonly content: string;
    constructor(log: string) {
        this.content = log;
        this.loader = getLoader(log);
        this.gameVersion = getMinecraftVersion(log);
        this.javaVersion = getJavaVersion(log);
        this.warnCount = log.match(/\[*\/WARN\]/g)?.length ?? 0;
        this.errorCount = log.match(/\[*\/ERROR\]/g)?.length ?? 0;
        if (this.loader?.name == 'Fabric') {
            const modMatch = log.match(/- (\w|-)+ (\w+.|\w+)+/g);
            if (modMatch) {
                this.mods = new Map<string, string>(
                    modMatch.map((modText) => {
                        const modInfo = modText.split(' ');
                        return [modInfo[1], modInfo[2]];
                    })
                );
            }
        } else if (this.loader?.name == 'Quilt') {
            const modMatch = log.match(/ ([a-z]|-|_)+ *\| (\w+.|\w+)+/g);
            if (modMatch) {
                this.mods = new Map<string, string>(
                    modMatch.map((modText) => {
                        const modInfo = modText
                            .split(' ')
                            .filter((a) => a && a != '|');
                        return [modInfo[0], modInfo[1]];
                    })
                );
            }
        } else if (this.loader?.name == 'Forge') {
            const modMatch = log.match(/\|([^ A-Z])+ *\|\d[^ |]+/g);
            if (modMatch) {
                this.mods = new Map<string, string>(
                    modMatch.map((modText) => {
                        const modInfo = modText
                            .split(' ')
                            .map((text) => text.slice(1))
                            .filter((text) => text);
                        return [modInfo[0], modInfo[1]];
                    })
                );
            }
        }
    }
}
