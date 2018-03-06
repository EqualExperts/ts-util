import "jest"
import * as path from "path"
import * as fs from "fs"

import { buildConfigAdapter } from "../../src/config/adapter"
import {
    CampaignMonitorConfig,
    buildSendTransactionalEmailAdapter,
    TransactionalEmailDetails,
    SendTransactionalEmailAdapter
} from "./../../src/campaignmon/transactionalEmailAdapter"

type BuildCampaignMonitorConfig = (conf: (key: string) => string) => CampaignMonitorConfig

let cmConfig

beforeAll(async () => {
    const config = loadConfig()
    cmConfig = buildConfig(config)
})

describe("Transactional Email Adapter", () => {

    it("Sends a transactional email without attachments", async () => {
        const underTest: SendTransactionalEmailAdapter = buildSendTransactionalEmailAdapter(cmConfig)
        const smartEmailDetails: TransactionalEmailDetails = {
            smartEmailID: "c73d4408-f246-4f2a-970f-49ac23648cb7",
            emailTo: "esoftware@equalexperts.com",
            emailPlaceholderValues: {
                firstname: "ES",
                client: "Equal Software",
                date: "01/01/2018",
                role: "Ninja Developer",
                engagement_manager: "Cool Dude"
            },
            attachments: []
        }

        const result = await underTest(smartEmailDetails)

        // TODO: inspect response and make it strong typed
        expect(result).toBeTruthy()
    })
})

async function loadConfigs() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive/"
    if (fs.existsSync(keyBaseFilePath)) {
        // To run locally
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
