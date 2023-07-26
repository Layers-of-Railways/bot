import { Analyzer } from '../handlers/log.handler';
import { minecraftVersionAnalyzer } from './minecraftVersion';
import { optifineAnalyzer } from './optifine';

export const logAnalyzers: Analyzer[] = [
    optifineAnalyzer,
    minecraftVersionAnalyzer,
];

export default logAnalyzers;
