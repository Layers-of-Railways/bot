import { Analyzer } from '../handlers/log.handler';

export const optifineAnalyzer: Analyzer = async (log) => {
    const matchesOptifine = log.mods
        ? log.mods.has('optifine')
        : log.content.match(/f_174747_/);
    if (matchesOptifine) {
        return {
            name: 'Incompatible with OptiFine',
            value: "OptiFine breaks Steam 'n' Rails and is Incompatible\n\nCheck `/tag optifine` for more info & alternatives you can use.",
        };
    }
    return null;
};
