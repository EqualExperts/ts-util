export declare type Definition = {
    [name: string]: Format;
};
export declare type Format = {
    format?: string | any[];
};
export declare const getValueForEnvVar: (key: string) => string;
export declare const buildConfigAdapter: (definition: Definition) => (key: string) => string;
