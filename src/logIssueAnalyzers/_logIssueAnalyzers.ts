import { Analyzer } from '../handlers/log.handler';
import { createVersionAnalyzer } from './createVersion';
import { farmersDelightNPE } from './farmersDelightNPE';

export const logAnalyzers: Analyzer[] = [
    createVersionAnalyzer,
    farmersDelightNPE,
];

export default logAnalyzers;
