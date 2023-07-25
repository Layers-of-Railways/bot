import { LogAnalyzer } from '../handlers/log.handler'
import { optifineAnalyzer } from './optifine'


export const logAnalyzers: LogAnalyzer[] = [
    optifineAnalyzer
]

export default logAnalyzers