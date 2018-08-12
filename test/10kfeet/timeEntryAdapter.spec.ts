import "jest"
import * as fs from "fs"
import * as path from "path"
import { extractDto, TimeEntryDto, toApprovedOrNot, StatusDto } from "../../src/10kfeet/timeEntryAdapter"
import { buildFetchTimeEntryAdapterWithResultsPerPage } from "../../src/10kfeet/timeEntryAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"

let token
let originalTimeout

beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000

    prepareProcessEnvVars()

    const envVars = buildConfigAdapter({
        TENKFT_API_TOKEN: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
    token = envVars("TENKFT_API_TOKEN")
})

xdescribe("10K Feet Time Entries", () => {
// hhh
    const baseUrl = "https://api.10000ft.com"
    const resultsPerPage = 50
    xit("should fetch all TimeEntries from all pages", async () => {
        const from = "2017-1-1"
        const to = "2017-11-31"
        const lessResultsPerPage = 2

        const underTest = buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, lessResultsPerPage)
        const result = await underTest(from, to)

        const firstResult = result[0]

        expect(firstResult.userId).toBeGreaterThan(0)
        expect(firstResult.assignableId).toBeGreaterThan(0)
        expect(firstResult.parentId).toBeNull()
        expect(firstResult.assignableName).toBe("HMRC")
        expect(firstResult.assignableType).toBe("Project")
        expect(firstResult.email).toBe("esoftware.aslive@equalexperts.com")
        expect(firstResult.firstName).toBe("Associate")
        expect(firstResult.lastName).toBe("Joao")
        expect(firstResult.hourlyBillRate).toBe(1)
        expect(firstResult.projectName).toBe("Getting the most out of 10,000ft")
        expect(firstResult.projectOrPhaseStartDate).toBe("2017-11-24")
        expect(firstResult.projectOrPhaseEndDate).toBe("2018-03-23")
        expect(firstResult.resourceStartDateOnProjectOrPhase).toBe("2017-11-24")
        expect(firstResult.resourceEndDateOnProjectOrPhase).toBe("2018-03-23")
        expect(firstResult.createdAt).toBe("2017-11-24T16:11:22Z")
        expect(firstResult.updatedAt).toBe("2017-11-24T16:11:22Z")

        expect(firstResult.status).toEqual([{
            approvable_id: 788396,
            approvable_type: "TimeEntry",
            approved_at: "2017-12-18T17:56:44Z",
            approved_by: 2167,
            created_at: "2017-12-18T17:56:44Z",
            id: 1,
            status: "approved",
            submitted_at: "2017-12-18T17:56:44Z",
            submitted_by: 2167,
            updated_at: "2017-12-18T17:56:44Z"
        } as StatusDto])

        const fourthResult = result[4]
        expect(fourthResult.parentId).toBeGreaterThan(0)

    })

    xit("entries that are Leaves should have assignableName equal to assignableType and billable set to false",
        async () => {
            const from = "2017-12-20"
            const to = "2017-12-20"

            const underTest = buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
            const result = await underTest(from, to)

            expect(result[3].assignableName).toBe("LeaveType")
            expect(result[3].assignableType).toBe("LeaveType")
            expect(result[3].billable).toBe(false)
        })

    xit("returns an \"approved\" timeentry when there are no \"pending\" approvals", async () => {
        const from = "2017-12-04"
        const to = "2017-12-09"

        const underTest = buildFetchTimeEntryAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
        const result = await underTest(from, to)

        const firstResult = result[0]
        expect(firstResult.approved).toBe(true)
    })
})

xdescribe("toApprovedOrNot (exposed internal method - see comments on its definition)", () => {
    it("returns an \"approved\" time entry when there are no \"pending\" approvals", async () => {
        const approvals = [
            { status: "approved" },
        ]

        const result = toApprovedOrNot(approvals)

        expect(result).toBe(true)
    })

    it("returns a \"pending\" time entry when there is at least one \"pending\" approval", () => {
        const approvals = [
            { status: "approved" },
            { status: "pending" },
        ]

        const result = toApprovedOrNot(approvals)

        expect(result).toBe(false)
    })

    it("returns a \"not approved\" time entry when it has undefined approvals", () => {
        const undefinedApprovals = undefined

        const result = toApprovedOrNot(undefinedApprovals)

        expect(result).toBe(false)
    })

    it("returns a \"not approved\" time entry when it has NO approvals", () => {
        const noApprovals = []

        const result = toApprovedOrNot(noApprovals)

        expect(result).toBe(false)
    })
})

xdescribe("TimeEntries from 10KFeet (Stubbed)", () => {
    it("should extract into required fields", () => {
        const tenKResponse: string =
            fs.readFileSync(path.resolve(__dirname, "../stubs/10kfttimeentry_response.json"), "utf-8")
        const tenKJSON = JSON.parse(tenKResponse)

        const dto: TimeEntryDto = extractDto(tenKJSON.data[0])

        expect(dto.day).toEqual(new Date("2017-11-07"))
        expect(dto.hours).toBe(1)
        expect(dto.userId).toBe(380187)
        expect(dto.assignableId).toBe(12356)
        expect(dto.assignableType).toBe("Project")
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
