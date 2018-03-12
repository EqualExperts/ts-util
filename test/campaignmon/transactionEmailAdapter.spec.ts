import "jest"
import * as os from "os"
import * as path from "path"
import * as fs from "fs"

import { buildConfigAdapter } from "../../src/config/adapter"
import {
    CampaignMonitorConfig,
    buildSendTransactionalEmailAdapter,
    TransactionalEmailDetailsDto,
    SendTransactionalEmailAdapter,
    SendTransactEmailResponse,
    SendTransactEmailResultDto,
    SendTransactEmailErrorDto
} from "./../../src/campaignmon/transactionalEmailAdapter"

type BuildCampaignMonitorConfig = (conf: (key: string) => string) => CampaignMonitorConfig

let cmConfig: CampaignMonitorConfig
let smartEmailDetails: TransactionalEmailDetailsDto
let smartEmailDetailsWithAttachments: TransactionalEmailDetailsDto

beforeAll(async () => {
    const config = loadConfig()
    cmConfig = buildConfig(config)
    smartEmailDetails = {
        smartEmailID: "c73d4408-f246-4f2a-970f-49ac23648cb7",
        emailTo: "esoftware+travisinttest@equalexperts.com",
        emailCC: "esoftware+travisinttestcc@equalexperts.com",
        emailPlaceholderValues: {
            firstname: "ES",
            client: "Equal Software",
            date: "01/01/2018",
            role: "Ninja Developer",
            engagement_manager: "Cool Dude"
        },
        attachments: []
    }
    smartEmailDetailsWithAttachments = { ...smartEmailDetails }

    const sampleFilePath = path.join(__dirname, "samplefile.txt")
    smartEmailDetailsWithAttachments.attachments = [ sampleFilePath ]
})

describe("Transactional Email Adapter", () => {
    it("Sends a transactional email without attachments", async () => {
        const expectedResponseTo = {
            Status: "Accepted",
            MessageID: "<not relevant for the test>",
            Recipient: smartEmailDetails.emailTo
        } as SendTransactEmailResultDto
        const expectedResponseCC = {
            Status: "Accepted",
            MessageID: "<not relevant for the test>",
            Recipient: smartEmailDetails.emailCC
        } as SendTransactEmailResultDto

        const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
        const result: Promise<SendTransactEmailResponse> = underTest(smartEmailDetails)

        result
            .then((response: SendTransactEmailResultDto[]) => {
                console.log(response)
                expect(response).toBeTruthy()
                expect(response).toHaveLength(2)
                expect(response[0].Status).toBe(expectedResponseTo.Status)
                expect(response[0].MessageID).not.toHaveLength(0)
                expect(response[0].Recipient).toBe(expectedResponseTo.Recipient)
                expect(response[1].Status).toBe(expectedResponseCC.Status)
                expect(response[1].MessageID).not.toHaveLength(0)
                expect(response[1].Recipient).toBe(expectedResponseCC.Recipient)
            })
            .catch((error: SendTransactEmailErrorDto) => fail("Expected to succeed"))
    })

    it("Sends a transactional email with attachments", async () => {
        const expectedResponseTo = {
            Status: "Accepted",
            MessageID: "<not relevant for the test>",
            Recipient: smartEmailDetails.emailTo
        } as SendTransactEmailResultDto
        const expectedResponseCC = {
            Status: "Accepted",
            MessageID: "<not relevant for the test>",
            Recipient: smartEmailDetails.emailCC
        } as SendTransactEmailResultDto

        const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
        const result: Promise<SendTransactEmailResponse> = underTest(smartEmailDetailsWithAttachments)

        result
            .then((response: SendTransactEmailResultDto[]) => {
                console.log(response)
                expect(response).toBeTruthy()
                expect(response).toHaveLength(2)
                expect(response[0].Status).toBe(expectedResponseTo.Status)
                expect(response[0].MessageID).not.toHaveLength(0)
                expect(response[0].Recipient).toBe(expectedResponseTo.Recipient)
                expect(response[1].Status).toBe(expectedResponseCC.Status)
                expect(response[1].MessageID).not.toHaveLength(0)
                expect(response[1].Recipient).toBe(expectedResponseCC.Recipient)
            })
            .catch((error: SendTransactEmailErrorDto) => fail("Expected to succeed"))
    })

    it("Fails to send transaction email when the Smart Email Id is not valid", async () => {
            const badSmartEmailDetails = { ...smartEmailDetails }
            badSmartEmailDetails.smartEmailID = "bad smart email id"
            const expectedResponse: SendTransactEmailErrorDto = {
                Code: 926,
                Message: "Smart email not found."
            } as SendTransactEmailErrorDto

            const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
            const result: Promise<SendTransactEmailResponse> = underTest(badSmartEmailDetails)

            result
                .then((response: SendTransactEmailResultDto[]) => fail("Expected to fail"))
                .catch((error: SendTransactEmailErrorDto) => {
                    expect(error).toBeTruthy()
                    expect(error.Code).toBe(expectedResponse.Code)
                    expect(error.Message).toBe(expectedResponse.Message)
                })
    })
})

async function loadConfigs() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive/"
    if (fs.existsSync(keyBaseFilePath)) {
        const credsFilePath = path.join(keyBaseFilePath, "campaign-monitor.json")
        const credsJson = JSON.parse(fs.readFileSync(credsFilePath, "utf-8").trim())
        process.env.CAMPAIGN_MONITOR_APIKEY = credsJson.apiKey
    }
}

const loadConfig = () => {
    loadConfigs()
    return buildConfigAdapter({
        CAMPAIGN_MONITOR_APIKEY: {
            format: "*",
        }
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
}

const buildConfig: BuildCampaignMonitorConfig = (conf: (key: string) => string) => {
    return {
        apiKey: conf("CAMPAIGN_MONITOR_APIKEY")
    }
}
