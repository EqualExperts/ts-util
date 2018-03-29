import "jest"
import * as fs from "fs"
import * as path from "path"
import {
    buildGetUsersInfoAdapterWithResultsPerPage,
    GetUsersInfoAdapter,
    UserInfoDto,
} from "../../src/10kfeet/usersInfoAdapter"
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

describe("10kft User Info Adapter", () => {
    it("should return users information for a given list of users", async () => {
        // given
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        const userIds = [2167, 2204, 2769]
        const resultsPerPage = 1

        // when
        const underTest: GetUsersInfoAdapter =
            buildGetUsersInfoAdapterWithResultsPerPage(baseUrl, token, resultsPerPage)
        const result: UserInfoDto[] = await underTest(userIds)
        const sortedByEmail = (a, b) => (a.email.localeCompare(b.email))

        // then
        const expectedUsersInfo = [{
            userId: 2167,
            firstName: "Associate",
            lastName: "Joao",
            email: "esoftware.aslive@equalexperts.com",
        }, {
            userId: 2204,
            firstName: "Associate",
            lastName: "Leena",
            email: "lbora@equalexperts.com",
        }, {
            userId: 2769,
            firstName: "Test",
            lastName: "Archived",
            email: null
        }]
        expect(result.sort(sortedByEmail)).toEqual(expectedUsersInfo.sort(sortedByEmail))
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
