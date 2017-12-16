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
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    prepareProcessEnvVars()

    envVars = buildConfigAdapter({
        TENKFT_API_TOKEN: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
})

describe("10K Feet Time Entries", () => {
    it("should fetch all TimeEntries from all pages", async () => {
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
        expect(result[0].userId).toBeGreaterThan(0)
        expect(result[0].assignableId).toBeGreaterThan(0)
        expect(result[0].assignableName).toBe("Getting the most out of 10,000ft")
        expect(result[0].email).toBe("esoftware.aslive@equalexperts.com")
        expect(result[0].firstName).toBe("Equal")
        expect(result[0].lastName).toBe("Software")
    })
})

describe("TimeEntries from 10KFeet (Stubbed)", () => {
    it("should extract into required fields", () => {
        const tenKResponse: string =
            fs.readFileSync(path.resolve(__dirname, "../stubs/10kfttimeentry_response.json"), "utf-8")

        const tenKJSON = JSON.parse(tenKResponse)

        const dto: TimeEntryDto = extractDto(tenKJSON.data[0])

        expect(dto.day).toEqual(new Date("2017-11-07"))
        expect(dto.hours).toBe(1)
        expect(dto.userId).toBe(380187)
        expect(dto.assignableId).toBe(12356)
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
