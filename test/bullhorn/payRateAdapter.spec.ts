import "jest"
import BullhornClient from "tmp-fork-bullhorn/lib/Client"
import * as fs from "fs"
import * as path from "path"
import { buildBullhornClient, BullhornConfig } from "../../src/bullhorn/payRateAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"
import { appendFileSync } from "fs"
import { PayRateDto, buildBullhornPayRateAdapter, BullhornPayRateAdapter } from "../../src/bullhorn/payRateAdapter"

let originalTimeout
let bhConfig

beforeAll(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    const config = loadBHConfig()
    bhConfig = buildBullhornConfig(config)
})

describe("Pay rates from Bullhorn", async () => {
    xit("Fetches Pay rate for a given email addresses", async () => {
        // given
        const bhClient: BullhornClient = await buildBullhornClient(bhConfig)
        const bhPayRateAdapter: BullhornPayRateAdapter = buildBullhornPayRateAdapter(bhClient)
        const pferreiraEmail = "pferreira@equalexperts.com"
        const isacNewtonEmail = "inewton@equalexperts.com"

        // when
        const actualPayRates = await bhPayRateAdapter([pferreiraEmail, isacNewtonEmail])

        // then
        const expectedPayRates = [
            { email: pferreiraEmail, rates: [550] } as PayRateDto,
            { email: isacNewtonEmail, rates: [400] } as PayRateDto,
        ]
        expect(actualPayRates).toEqual(expectedPayRates)
    })
})

function loadBullhornConfigs() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const bullhornCredsFilePath = path.join(keyBaseFilePath, "bullhorn.json")

    if (fs.existsSync(bullhornCredsFilePath)) {
        const bhJsonConfig = JSON.parse(fs.readFileSync(bullhornCredsFilePath, "utf-8").trim())
        process.env.BH_SERVER = bhJsonConfig.bhServer
        process.env.BH_AUTH_SERVER = bhJsonConfig.bhAuthServer
        process.env.BH_CLIENT_ID = bhJsonConfig.bhClientId
        process.env.BH_SECRET = bhJsonConfig.bhSecret
        process.env.BH_USER_NAME = bhJsonConfig.bhUserName
        process.env.BH_PASSWORD = bhJsonConfig.bhPassowrd
    }
}

const loadBHConfig = () => {
    loadBullhornConfigs()

    return buildConfigAdapter({
        BH_SERVER: {
            format: "url",
        },
        BH_AUTH_SERVER: {
            format: "url",
        },
        BH_CLIENT_ID: {
            format: "*",
        },
        BH_SECRET: {
            format: "*",
        },
        BH_USER_NAME: {
            format: "*",
        },
        BH_PASSWORD: {
            format: "*",
        },
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
}

const buildBullhornConfig: (conf: (key: string) => string) => BullhornConfig = (conf: (key: string) => string) => {
    return {
        bhServer: conf("BH_SERVER"),
        bhAuthServer: conf("BH_AUTH_SERVER"),
        bhClientId: conf("BH_CLIENT_ID"),
        bhSecret: conf("BH_SECRET"),
        bhUserName: conf("BH_USER_NAME"),
        bhPassowrd: conf("BH_PASSWORD"),
    }
}

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
