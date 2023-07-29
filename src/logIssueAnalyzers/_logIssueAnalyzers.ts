import { Analyzer } from '../handlers/log.handler';
import { createVersionAnalyzer } from './createVersion';
import { minecraftVersionAnalyzer } from './minecraftVersion';
import { optifineAnalyzer } from './optifine';

export const logAnalyzers: Analyzer[] = [
    optifineAnalyzer,
    minecraftVersionAnalyzer,
    createVersionAnalyzer,
];

export default logAnalyzers;
