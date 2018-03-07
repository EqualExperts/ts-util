import "jest"
import * as os from "os"
import * as path from "path"
import * as fs from "fs"

import { buildConfigAdapter } from "../../src/config/adapter"
import {
    CampaignMonitorConfig,
    buildSendTransactionalEmailAdapter,
    TransactionalEmailDetails,
    SendTransactionalEmailAdapter,
    SendTransactEmailResponse,
    SendTransactEmailResult,
    SendTransactEmailError
} from "./../../src/campaignmon/transactionalEmailAdapter"

type BuildCampaignMonitorConfig = (conf: (key: string) => string) => CampaignMonitorConfig

let cmConfig: CampaignMonitorConfig
let smartEmailDetails: TransactionalEmailDetails
let smartEmailDetailsWithAttachments: TransactionalEmailDetails

beforeAll(async () => {
    const config = loadConfig()
    cmConfig = buildConfig(config)
    smartEmailDetails = {
        smartEmailID: "c73d4408-f246-4f2a-970f-49ac23648cb7",
        emailTo: "esoftware+travisinttest@equalexperts.com",
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
        const expectedResponse = {
            Status: "Accepted",
            MessageID: "<not relevant for the test>",
            Recipient: smartEmailDetails.emailTo
        } as SendTransactEmailResult

        const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
        const result: Promise<SendTransactEmailResponse> = underTest(smartEmailDetails)

        result
            .then((response: SendTransactEmailResult[]) => {
                console.log(response)
                expect(response).toBeTruthy()
                expect(response).toHaveLength(1)
                expect(response[0].Status).toBe(expectedResponse.Status)
                expect(response[0].MessageID).not.toHaveLength(0)
                expect(response[0].Recipient).toBe(expectedResponse.Recipient)
            })
            .catch((error: SendTransactEmailError) => fail("Expected to succeed"))
    })

    it("Sends a transactional email with attachments", async () => {
        const expectedResponse = {
            Status: "Accepted",
            MessageID: "<not relevant for the test>",
            Recipient: smartEmailDetails.emailTo
        } as SendTransactEmailResult

        const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
        const result: Promise<SendTransactEmailResponse> = underTest(smartEmailDetailsWithAttachments)

        result
            .then((response: SendTransactEmailResult[]) => {
                console.log(response)
                expect(response).toBeTruthy()
                expect(response).toHaveLength(1)
                expect(response[0].Status).toBe(expectedResponse.Status)
                expect(response[0].MessageID).not.toHaveLength(0)
                expect(response[0].Recipient).toBe(expectedResponse.Recipient)
            })
            .catch((error: SendTransactEmailError) => fail("Expected to succeed"))
    })

    it("Fails to send transaction email when the Smart Email Id is not valid", async () => {
            const badSmartEmailDetails = { ...smartEmailDetails }
            badSmartEmailDetails.smartEmailID = "bad smart email id"
            const expectedResponse: SendTransactEmailError = {
                Code: 926,
                Message: "Smart email not found."
            } as SendTransactEmailError

            const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
            const result: Promise<SendTransactEmailResponse> = underTest(badSmartEmailDetails)

            result
                .then((response: SendTransactEmailResult[]) => fail("Expected to fail"))
                .catch((error: SendTransactEmailError) => {
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
