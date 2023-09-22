import { Analyzer } from '../handlers/log.handler';

export const extendedBogeysAnalyzer: Analyzer = async (log) => {
    if (!log.mods) return null;

    const matchesCreate = log.mods.get('create')?.match(/0.5.1.[c|d|e]/);

    const matchesExtendedBogeys =
        log.mods.has('extendedbogeys') &&
        log.content.match(
            /NoSuchMethodError: 'com\.jozufozu\.flywheel\.util\.transform\.Transform\[\]/
        );
    if (matchesCreate && matchesExtendedBogeys) {
        return {
            name: 'Extended Bogeys',
            value: "Extended Bogeys has not yet updated to work with `0.5.1c/d`. Please downgrade to `0.5.1b`. And downgrade Steam 'n' Rails.",
        };
    }
    return null;
};
