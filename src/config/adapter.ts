import convict = require("convict")
import { Schema, SchemaObj } from "convict"

export type Definition = {
    [name: string]: Format,
}

export type Format = {
    format?: string | any[],
}

export const getValueForEnvVar = (key: string): string => (
    process.env[key] as string
)

type EnvironmentVariables = (key: string) => string
export const buildConfigAdapter = (definition: Definition): EnvironmentVariables => (key: string) => {
    const schema: Schema = {}
    Object.keys(definition).forEach((name) =>
        schema[name] = { env: name, format: definition[name].format, default: null },
    )

    const config = convict(schema)
    return config.get(key)
}
