import "jest"
import * as fs from "fs"
import * as path from "path"
import {
    buildFetchSettingsAdapter,
    SettingsDto,
} from "../../src/10kfeet/settingsAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"

let token
let originalTimeout

beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    prepareProcessEnvVars()

    const envVars = buildConfigAdapter({
        TENKFT_API_TOKEN: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
    token = envVars("TENKFT_API_TOKEN")
})

describe("10K Feet Settings Adapter", () => {

    const baseUrl = "https://vnext-api.10000ft.com"

    it("fetches settings of a project", async () => {
        const expectedSettingsResponse: string =
            fs.readFileSync(path.resolve(__dirname, "../stubs/10kft_settings_response.json"), "utf-8")

        const underTest = buildFetchSettingsAdapter(baseUrl, token)
        const result = await underTest()

        const expectedSettings: SettingsDto = JSON.parse(expectedSettingsResponse) as SettingsDto
        expect(result).toEqual(expectedSettings)
    })

})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
