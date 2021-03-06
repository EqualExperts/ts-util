import "jest"
import * as fs from "fs"
import * as path from "path"
import {
    buildFetchProjectInfoAdapter,
    ProjectInfo,
    buildFetchPhasesAdapter,
    PhaseDto
} from "../../src/10kfeet/projectAdapter"
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

describe("10K Feet Project Adapter", () => {

    const baseUrl = "https://vnext-api.10000ft.com"

    it("fetchs phases of a project", async () => {
        const projectId = 10291

        const underTest = buildFetchPhasesAdapter(baseUrl, token)
        const result = await underTest(projectId)

        const expectedPhases: PhaseDto[] = [
            {
                id: 10292,
                projectName: "Exciting project",
                phaseName: "Exciting project",
                budgetItems: { category: "PO12220340" },
            },
            {
                id: 10293,
                projectName: "Exciting project",
                phaseName: "Non-billable",
                budgetItems: { category: "PO12220360" },
            },
            {
                id: 10353,
                projectName: "Exciting project",
                phaseName: "Data Migration From BullHorn",
                budgetItems: { category: "PO12220310" },
            },
        ]
        expect(result).toEqual(expectedPhases)
    })

    it("fetchs project with billable set to false on Internal projects", async () => {
        const projectId = 10264

        const underTest = buildFetchProjectInfoAdapter(baseUrl, token)
        const result = await underTest(projectId)

        const expected = {
            id: projectId,
            parentId: null,
            name: "Getting the most out of 10,000ft",
            state: "Internal",
            billable: false,
            clientName: "HMRC",
            startDate: "2017-11-24",
            endDate: "2018-03-23",
        } as ProjectInfo

        expect(result).toEqual(expected)
    })

    it("fetchs project with billable set to true on Confirmed projects ", async () => {
        const projectId = 10353

        const underTest = buildFetchProjectInfoAdapter(baseUrl, token)
        const result = await underTest(projectId)

        const expected = {
            id: projectId,
            parentId: 10291,
            name: "Exciting project",
            state: "Confirmed",
            billable: true,
            clientName: "Expert Software",
            startDate: "2017-10-01",
            endDate: "2018-12-31",
        } as ProjectInfo
        expect(result).toEqual(expected)
    })

    it("fetchs project with billable set to true on Tentative projects ", async () => {
        const projectId = 10354

        const underTest = buildFetchProjectInfoAdapter(baseUrl, token)
        const result = await underTest(projectId)

        const expected = {
            id: projectId,
            parentId: null,
            name: "Tentative Project",
            state: "Tentative",
            billable: true,
            clientName: "Expert Software",
            startDate: "2017-12-21",
            endDate: "2019-02-13",
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
