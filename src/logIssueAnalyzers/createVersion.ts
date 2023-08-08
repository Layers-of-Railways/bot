import { Analyzer } from '../handlers/log.handler';

export const createVersionAnalyzer: Analyzer = async (log) => {
    const matchesCreate = log.mods
        ? log.mods.get('create') == '0.5.1.c'
        : log.content.match(/create-(.)+-0\.5\.1\.c/);
    if (matchesCreate) {
        return {
            name: 'Incompatible with Create 0.5.1c',
            value: "Create: Steam 'n' Rails is currently incompatible with `Create 0.5.1c`. Downgrade to `Create 0.5.1b`.",
        };
    }
    return null;
};
