import "jest"
import * as fs from "fs"
import * as path from "path"
import { transform, TimeEntryDto } from "../../src/10kfeet/timeEntryAdapter"
import { buildFetchTimeEntryAdapterWithResultsPerPage } from "../../src/10kfeet/timeEntryAdapter"

describe("10K Feet Time Entries", () => {
    // This test is ignored because we don't have test creds for 10kFt
    test(" should fetch all TimeEntries from all pages", async () => {
        // given
        const from = "2017-1-1"
        const to = "2017-11-11"
        const baseUrl = "https://api.10000ft.com"
        const resultsPerPage = 2
        /* tslint:disable */
        const token = "ABCD"
        /* tslint:enable */
        const fetchTimeEntryAdapter: (from: string, to: string) => Promise<TimeEntryDto[]> =
            buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)

        const result = await fetchTimeEntryAdapter(from, to)

        expect(result.length).toBe(4)
    })

    // Add no result tests
})

describe(" TimeEntries from 10KFeet  ", () => {
    test(" should transform into required fields", () => {
        const tenKResponse: string =
            fs.readFileSync(path.resolve(__dirname, "../stubs/10kfttimeentry_response.json"), "utf-8")

        const tenKJSON = JSON.parse(tenKResponse)

        const dto: TimeEntryDto = transform(tenKJSON.data)[0]

        expect(dto.day).toEqual(new Date("2017-11-07"))
        expect(dto.hours).toBe(1)
        expect(dto.userId).toBe(380187)
    })
})
