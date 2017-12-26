import "jest"
import * as fs from "fs"
import * as path from "path"
import { TimeEntryDto } from "../../src/10kfeet/timeEntryAdapter"
import { buildFetchTimeEntryAdapterWithResultsPerPage } from "../../src/10kfeet/timeEntryAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"

let envVars
let originalTimeout

beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000

    prepareProcessEnvVars()

    envVars = buildConfigAdapter({
        TENKFT_API_TOKEN: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
})

describe("10K Feet Time Entries", () => {

    it("returns a promise rejection with an error given a bad response", async () => {
        const from = "BAD DATE"
        const to = "BAD DATE"
        const resultsPerPage = 2
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        const underTest: (from: string, to: string) => Promise<TimeEntryDto[]> =
            buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
        const result = underTest(from, to)

        expect(result).rejects.toBe(
            "[Request Error]" +
            "[https://vnext-api.10000ft.com/api/v1/time_entries?from=BAD DATE&to=BAD DATE&per_page=2]" +
            "[HTTP 500 - Internal Server Error][payload:{\"message\":\"internal error\"}]")
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
