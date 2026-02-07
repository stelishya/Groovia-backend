export const IConfigServiceToken = Symbol('IConfigService');

export interface IConfigService {
    get<T = any>(key: string): T | undefined;
}
