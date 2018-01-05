import "jest"
import * as fs from "fs"
import * as path from "path"
import { buildFetchProjectInfoAdapter, ProjectInfo } from "../../src/10kfeet/projectAdapter"
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

describe("10K Feet Project Info", () => {
    it("should fetch project info", async () => {
        // given
        const projectId = 10264
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        // when
        const underTest: (projectId: number) => Promise<ProjectInfo> =
            buildFetchProjectInfoAdapter(baseUrl, token)
        const result = await underTest(projectId)

        // then
        const expected = {
            id: projectId,
            name: "Getting the most out of 10,000ft",
            state: "Internal",
            billable: false,
            clientName: "HMRC",
        } as ProjectInfo

        expect(result).toEqual(expected)
    })

    it("should fetch project info with billable set to true on Confirmed projects ", async () => {
        // given
        const projectId = 10353
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        // when
        const underTest: (projectId: number) => Promise<ProjectInfo> =
            buildFetchProjectInfoAdapter(baseUrl, token)
        const result = await underTest(projectId)

        // then
        const expected = {
            id: projectId,
            name: "Exciting project",
            state: "Confirmed",
            billable: true,
            clientName: "Expert Software",
        } as ProjectInfo

        expect(result).toEqual(expected)
    })

    it("should fetch project info with billable set to true on Tentative projects ", async () => {
        // given
        const projectId = 10354
        const baseUrl = "https://vnext-api.10000ft.com"
        const token = envVars("TENKFT_API_TOKEN")

        // when
        const underTest: (projectId: number) => Promise<ProjectInfo> =
            buildFetchProjectInfoAdapter(baseUrl, token)
        const result = await underTest(projectId)

        // then
        const expected = {
            id: projectId,
            name: "Tentative Project",
            state: "Tentative",
            billable: true,
            clientName: "Expert Software",
        } as ProjectInfo

        expect(result).toEqual(expected)
    })
})

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const a10kftAPItokenFilePath = path.join(keyBaseFilePath, "10kft-api-token.txt")

    if (fs.existsSync(a10kftAPItokenFilePath)) {
        process.env.TENKFT_API_TOKEN = fs.readFileSync(a10kftAPItokenFilePath, "utf-8").trim()
    }
}
