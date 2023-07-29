import { Analyzer } from '../handlers/log.handler';
import { getMinecraftVersion } from '../logs/Analyzer';

export const minecraftVersionAnalyzer: Analyzer = async (log) => {
    const minecraftVersion = getMinecraftVersion(log);
    console.log(minecraftVersion);
    if (!minecraftVersion) return null;
    const incompatibleVersions = new Set(['1.19.3', '1.19.4']);
    if (incompatibleVersions.has(minecraftVersion))
        return {
            name: 'Incompatible with that version of Minecraft',
            value: "Steam 'n' Rails is currently only compatible with MC 1.18.2 and 1.19.2.",
        };
    return null;
};
