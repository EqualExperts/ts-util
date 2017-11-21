import "jest"
import {buildFetchTimeEntryAdapter, TimeEntryDto} from "../../src/10kfeet/timeEntryAdapter"

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
