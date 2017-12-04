import "jest"
import * as fs from "fs"
import * as path from "path"
import { extractDto, TimeEntryDto } from "../../src/10kfeet/timeEntryAdapter"
import { buildFetchTimeEntryAdapterWithResultsPerPage } from "../../src/10kfeet/timeEntryAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"

let envVars
let originalTimeout

beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 8000

    prepareProcessEnvVars()

    envVars = buildConfigAdapter({
        TENKFT_API_TOKEN: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
})

describe("10K Feet Time Entries", () => {
    // This test is ignored because we don't have test creds for 10kFt
    it(" should fetch all TimeEntries from all pages", async () => {
        // given
        const from = "2017-1-1"
        const to = "2017-11-31"
        const resultsPerPage = 2
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        const underTest: (from: string, to: string) => Promise<TimeEntryDto[]> =
            buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
        const result = await underTest(from, to)

        expect(result.length).toBe(4)
    })
})

describe(" TimeEntries from 10KFeet  ", () => {
    it(" should extract into required fields", () => {
        const tenKResponse: string =
            fs.readFileSync(path.resolve(__dirname, "../stubs/10kfttimeentry_response.json"), "utf-8")

        const tenKJSON = JSON.parse(tenKResponse)

        const dto: TimeEntryDto = extractDto(tenKJSON.data[0])

        expect(dto.day).toEqual(new Date("2017-11-07"))
        expect(dto.hours).toBe(1)
        expect(dto.userId).toBe(380187)
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
