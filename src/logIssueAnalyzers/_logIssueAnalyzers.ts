import { Analyzer } from '../handlers/log.handler';
import { createVersionAnalyzer } from './createVersion';

export const logAnalyzers: Analyzer[] = [createVersionAnalyzer];

export default logAnalyzers;
