import "jest"
import "fp-ts"
import { buildConfigAdapter } from "../../src/config/adapter"
import { Either } from "fp-ts/lib/Either"

describe("ConfigAdapter", () => {
    it("reads an environment variable", () => {
        const name = "FRUIT_ENV"
        const value = "oranges"
        givenThereIsAnEnvironmentVar(name, value)
        const definition = {
            FRUIT_ENV: {},
        }

        const underTest = buildConfigAdapter(definition)
        const result = underTest.fold(
            (left) => fail("expected to have a right with configAdapter: got left instead"),
            (envVars) => envVars(name),
        )

        expect(result).toBe(value)
    })

    it("can deal with multiple environment variables", () => {
        givenThereIsAnEnvironmentVar("FRUIT_ENV", "oranges")
        const name = "BOOKS_ENV"
        const value = "To Whom the Bell Tols"
        givenThereIsAnEnvironmentVar(name, value)
        const definition = {
            BOOKS_ENV: {},
            FRUIT_ENV: {},
        }

        const underTest = buildConfigAdapter(definition)
        const result = underTest.fold(
            (left) => fail("expected to have a right with configAdapter: got left instead"),
            (envVars) => envVars(name),
        )

        expect(result).toBe(value)
    })

    it("validates the format of the variable value", () => {
        const name = "SOME_URL"
        const value = "http://mondocao.com"
        givenThereIsAnEnvironmentVar(name, value)
        const definition = {
            SOME_URL: {
                format: "url",
            },
        }

        const underTest = buildConfigAdapter(definition)
        const result = underTest.fold(
            (left) => fail("expected to have a right with configAdapter: got left instead"),
            (envVars) => envVars(name),
        )

        expect(result).toBe(value)
    })

    it("returns an error when reading an env var with an incorrect format", () => {
        const name = "SOME_URL"
        const value = "_not_a_url"
        givenThereIsAnEnvironmentVar(name, value)

        const definition = {
            SOME_URL: {
                format: "url",
            },
        }

        const maybeEnvVars = buildConfigAdapter(definition)
        const result = maybeEnvVars.fold(
            (errorMessage) => errorMessage,
            (envVars) => "expected to have a left: got right instead",
        )

        expect(result).toBe(name + ": must be a URL: value was \"" + value + "\"")
    })

    it("returns an error when environment variable is defined but not set", () => {
        const unexistentVar = "SOME_UNDEFINED_VAR"
        const anotherUnexistentVar = "ANOTHER_UNDEFINED_VAR"

        const definition = {
            [unexistentVar]: {},
            [anotherUnexistentVar]: {},
        }

        const maybeEnvVars = buildConfigAdapter(definition)
        const result = maybeEnvVars.fold(
            (errorMessage) => errorMessage,
            (envVars) => "expected to have a left: got right instead",
        )

        expect(result).toBe(
            unexistentVar + ": defined but not set" + ";" +
            anotherUnexistentVar + ": defined but not set" + ";",
        )
    })
})

const givenThereIsAnEnvironmentVar = (key: string, value: string) => {
    process.env[key] = value
}
