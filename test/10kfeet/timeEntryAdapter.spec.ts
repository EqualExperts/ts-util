import "jest"
import * as fs from "fs"
import * as path from "path"
import { transform, buildFetchTimeEntryAdapter, TimeEntryDto} from "../../src/10kfeet/timeEntryAdapter"

describe("10K Feet Time Entries", () => {
   // This test is ignored because we don't have test creds for 10kFt
   xtest(" should fetch TimeEntries", async () => {
        // given
        const from = "2017-1-12"
        const to = "2017-11-11"
        const apiUrl = "https://api.10000ft.com/api/v1"
        /* tslint:disable */
        const token = "1234"
         /* tslint:enable */
        const fetchTimeEntryAdapter: (from: string, to: string) => Promise<TimeEntryDto[]> =
         buildFetchTimeEntryAdapter(apiUrl, token)

        const result = await fetchTimeEntryAdapter(from, to)

        expect(result.length).toBe(4)
   } )
} )

describe(" TimeEntries from 10KFeet  ", () => {
    test(" should transform into required fields", () => {
        const tenKResponse: string =
            fs.readFileSync(path.resolve(__dirname, "../stubs/10kfttimeentry_response.json"), "utf-8")

        const tenKJSON = JSON.parse(tenKResponse)

        const dto: TimeEntryDto = transform(tenKJSON)[0]

        expect(dto.day).toEqual(new Date("2017-11-07"))
        expect(dto.hours).toBe(1)
        expect(dto.userId).toBe(380187)
    })
})
