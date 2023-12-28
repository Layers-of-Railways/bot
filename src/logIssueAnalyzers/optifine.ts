import { Analyzer } from '../handlers/log.handler';

export const optifineAnalyzer: Analyzer = async (log) => {
    const matchesOptifine = log.content.match(
        /Optifine Has been detected, Disabled Warning Status: (true|false)/
    );

    if (matchesOptifine) {
        if (matchesOptifine?.[1] == 'true') {
            return {
                name: 'Optifine Warning Disabled',
                value: 'You appeared to have disabled the Optifine warning. Many issues you might encounter are caused by Optifine. You will not get any support due to this.',
            };
        } else {
            return {
                name: 'Incompatible with OptiFine',
                value: "OptiFine breaks Steam 'n' Rails and is Incompatible\n\nCheck `/tag optifine` for more info & alternatives you can use.",
            };
        }
    }
    return null;
};
