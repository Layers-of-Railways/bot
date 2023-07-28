import { Analyzer } from '../handlers/log.handler';

export const createVersionAnalyzer: Analyzer = async (text) => {
    const matchesCreate = text.match(/create-(.)+-0\.5\.1\.c/);
    if (matchesCreate) {
        return {
            name: 'Incompatible with Create 0.5.1',
            value: "Create: Steam 'n' Rails is currently incompatible with `Create 0.5.1c`. Downgrade to `Create 0.5.1b`.",
        };
    }
    return null;
};
