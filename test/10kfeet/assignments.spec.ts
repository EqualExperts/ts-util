import "jest"
import * as fs from "fs"
import * as path from "path"
import {
    buildFetchAssignmentsAdapter,
    AssignmentDto,
    fetchAssignmentsAdapter
} from "../../src/10kfeet/assignmentsAdapter"
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

describe("10K Feet Assignment Adapter", () => {

    const baseUrl = "https://vnext-api.10000ft.com"

    it("fetchs assignments for a project", async () => {
        const projectId = 10291

        const underTest: fetchAssignmentsForAProjectAdapter = buildFetchAssignmentsAdapter(baseUrl, token)
        const result = await underTest(projectId)

        const expectedPhases: AssignmentDto[] = [
            {
                id: 90558,
                assignable_id: 10291,
                ends_at: "2018-12-31",
                starts_at: "2017-12-27",
                user_id: 2204,
            }
        ]
        expect(result).toEqual(expectedPhases)
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
