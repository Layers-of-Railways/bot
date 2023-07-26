import { Analyzer } from '../handlers/log.handler';

export const optifineAnalyzer: Analyzer = async (text) => {
    const matchesOptifine = text.match(/f_174747_/);
    if (matchesOptifine) {
        return {
            name: 'Incompatible with OptiFine',
            value: "OptiFine breaks Steam 'n' Rails and is Incompatible\n\nCheck `/tag optifine` for more info & alternatives you can use.",
        };
    }
    return null;
};
