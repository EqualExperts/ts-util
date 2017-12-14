import "jest"
import * as fs from "fs"
import * as path from "path"
import { buildFetchAssignableInfoAdapter } from "../../src/10kfeet/assignableInfoAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"

let envVars
let originalTimeout

beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    prepareProcessEnvVars()

    envVars = buildConfigAdapter({
        TENKFT_API_TOKEN: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
})

describe("10K Feet Assignable Info", () => {
    it("should fetch assignable info", async () => {
        // given
        const assignableId = 10264
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        // when
        const underTest: (assignableId: number) => Promise<string> =
            buildFetchAssignableInfoAdapter(baseUrl, token)
        const result = await underTest(assignableId)

        // then
        expect(result).toBe("Getting the most out of 10,000ft")
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
