import convict = require("convict")
import { Schema, SchemaObj } from "convict"
import "fp-ts"
import { Either, right, left } from "fp-ts/lib/Either"

export type Definition = {
    [name: string]: Format,
}

export type Format = {
    format?: string | any[],
}

type EnvironmentVariables = (key: string) => string
export const buildConfigAdapter = (definition: Definition): Either<string, EnvironmentVariables> => {
    const schema: Schema = {}
    Object.keys(definition).forEach((name) =>
        schema[name] = {
            env: name,
            format: definition[name].format ? definition[name].format : "*",
            default: null,
        },
    )

    const config = convict(schema)

    const missingVarMessages: string = Object.keys(definition).reduce((errorMessages, name) => {
        const value = config.get(name)
        return value == null ? errorMessages + name + ": defined but not set;" : errorMessages
    }, "")

    if (missingVarMessages.length > 0) {
        return left(missingVarMessages)
    }

    try {
        config.validate()
    } catch (e) {
        return left(e.message)
    }

    return right((key: string) => config.get(key))
}
