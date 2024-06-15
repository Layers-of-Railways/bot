import { Analyzer } from '../handlers/log.handler';

export const farmersDelightNPE: Analyzer = async (log) => {
    if (!log.mods) return null;

    const regex = log.content.match(/NullPointerException.*class_2960.*farmersdelight\$migrateGet/gs)
    if (regex) {
        return {
            name: 'Farmers Delight Missing Null check',
            value: "Farmers Delight is missing a null check, update farmers delight",
        };
    }

    return null;
};
