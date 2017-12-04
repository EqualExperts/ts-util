import "jest"
import BullhornClient from "bullhorn.ts"
import * as fs from "fs"
import * as path from "path"
import { buildBullhornClient, BullhornConfig } from "../../src/bullhorn/payRateAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"
import { appendFileSync } from "fs"

let originalTimeout
let config

beforeAll(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

    config = loadBHConfig()
})

describe("Pay rates from Bullhorn", () => {
    it("connects to bullhorn", async () => {
        const bhConfig = buildBullhornConfig(config)
        const email = "nikola.tesla@equalexperts.com"

        const bhClient: BullhornClient = await buildBullhornClient(bhConfig)
        const candidate = await bhClient.search("Candidate",
            {
                query: `email:${email} or email2:${email} or email3:${email}`,
                fields: ["id,firstName,lastName,placements"],
            })

        log(JSON.stringify(candidate))
        expect(candidate.data.length).toBe(1)
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
