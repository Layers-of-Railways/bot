import { Analyzer } from '../handlers/log.handler';

export const createVersionAnalyzer: Analyzer = async (log) => {
    if (!log.mods) return null;

    // Versions of Create 0.5.1b and Steam 'n' Rails 1.5.0 are incompatible.
    const matchesCreate = log.mods
        ? log.mods.get('create') == '0.5.1.b'
        : log.content.match(/create-(.)+-0\.5\.1\.b/);
    const matchesSNR = log.mods.get('railways')?.match(/1\.5\.0/);
    // Return an issue if both mods are present and the versions match.
    if (matchesCreate && matchesSNR) {
        return {
            name: 'Incompatible with Create 0.5.1b',
            value: "Create: Steam 'n' Rails `1.5.0` is incompatible with `Create 0.5.1b`. Upgrade to `Create 0.5.1c` or downgrade Steam 'n' Rails.",
        };
    }

    const matchesCreate2 = log.mods
        ? log.mods.get('create') == '0.5.1.c'
        : log.content.match(/create-(.)+-0\.5\.1\.c/);
    const matchesSNR2 = log.mods.get('railways')?.match(/1\.4\.3/);
    // Return an issue if both mods are present and the versions match.
    if (matchesCreate2 && matchesSNR2) {
        return {
            name: 'Version error',
            value: "Create: Steam 'n' Rails `1.4.3` is incompatible with `Create 0.5.1c`. Upgrade Steam 'n' Rails to `1.5.0`.",
        };
    }
    return null;
};
