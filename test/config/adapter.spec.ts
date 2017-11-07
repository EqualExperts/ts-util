import "jest"
import { buildConfigAdapter, getValueForEnvVar } from "../../src/config/adapter"

describe("ConfigAdapter", () => {
    it("reads an environment variable", () => {
        const key = "FRUIT_ENV"
        const value = "oranges"
        givenThereIsAnEnvironmentVar(key, value)
        const definition = {
            FRUIT_ENV: {},
        }

        const underTest = buildConfigAdapter(definition)
        const result = underTest(key)

        expect(result).toBe(value)
    })

    it("can deal with multiple environment variables", () => {
        givenThereIsAnEnvironmentVar("FRUIT_ENV", "oranges")
        const key = "BOOKS_ENV"
        const value = "To Whom the Bell Tols"
        givenThereIsAnEnvironmentVar(key, value)
        const definition = {
            BOOKS_ENV: {},
            FRUIT_ENV: {},
        }

        const underTest = buildConfigAdapter(definition)
        const result = underTest(key)

        expect(result).toBe(value)
    })
})

const givenThereIsAnEnvironmentVar = (key: string, value: string) => {
    process.env[key] = value
}
