import "jest"
import * as fs from "fs"
import * as path from "path"
import * as uuid from "uuid/v1"

import {
    GSuiteConfig,
    buildGSuiteClient,
    buildAccountCreatorAdapter,
    buildAccountRemoverAdapter,
    GSuiteAccountCreatorAdapter,
} from "../../src/gsuite/accountAdapter"
import { buildConfigAdapter } from "../../src/config/adapter"

import { appendFileSync } from "fs"

let originalTimeout
let gSuiteConfig
let randomEmail

beforeAll(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

    const config = loadConfig()
    gSuiteConfig = buildConfig(config)
    randomEmail = "tuser" + uuid() + "@aslive.dashboard.equalexperts.pt"
})

describe("GSuite operations", async () => {
    it("Creates an email account on GSuite", async () => {
        // given
        const gSuiteClient = await buildGSuiteClient(gSuiteConfig)
        const accountCreator: GSuiteAccountCreatorAdapter = buildAccountCreatorAdapter(gSuiteClient)

        const accountParams = {
            primaryEmail: randomEmail,
            name: {
                givenName: "Test1",
                familyName: "User1",
            },
            password: "T&4K^yAXPPC\\h(7}",
        }

        // when
        const result = await accountCreator(accountParams)

        // then
        const expectedResult = {
            kind: "admin#directory#user",
            primaryEmail: accountParams.primaryEmail,
            name: {
                givenName: accountParams.name.givenName,
                familyName: accountParams.name.familyName,
            },
            isAdmin: false,
            isDelegatedAdmin: false,
            customerId: "C0487729q",
            orgUnitPath: "/",
            isMailboxSetup: false,
        }
        expect(result.id).toBeTruthy()
        expect(result).toEqual(expect.objectContaining(expectedResult))
    })
    it("Deletes an account on GSuite", async () => {
        // given
        const gSuiteClient = await buildGSuiteClient(gSuiteConfig)
        const accountRemover = buildAccountRemoverAdapter(gSuiteClient)

        const userEmail = randomEmail

        // when
        const result = await accountRemover(userEmail)

        // then.
        expect(result).toEqual(true)
    })
})

function loadConfigs() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const credsFilePath = path.join(keyBaseFilePath, "gsuite.json")
    if (fs.existsSync(credsFilePath)) {
        const jsonConfig = JSON.parse(fs.readFileSync(credsFilePath, "utf-8").trim())
        process.env.GSUITE_CLIENT_EMAIL = jsonConfig.client_email
        process.env.GSUITE_PRIVATE_KEY = jsonConfig.private_key
        process.env.GSUITE_IMPERSONATION_EMAIL = "esoftware@aslive.dashboard.equalexperts.pt"
    } else {
        const dirNameGSuitePrivateKeyFile = path.join(__dirname, "gsuite.pem")
        process.env.GSUITE_PRIVATE_KEY = fs.readFileSync(dirNameGSuitePrivateKeyFile, "utf8")
    }
}

const loadConfig = () => {
    loadConfigs()

    return buildConfigAdapter({
        GSUITE_CLIENT_EMAIL: {
            format: "*",
        },
        GSUITE_PRIVATE_KEY: {
            format: "*",
        },
        GSUITE_IMPERSONATION_EMAIL: {
            format: "*",
        },
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
}

const buildConfig: (conf: (key: string) => string) => GSuiteConfig = (conf: (key: string) => string) => {
    return {
        clientEmail: conf("GSUITE_CLIENT_EMAIL"),
        privateKey: conf("GSUITE_PRIVATE_KEY"),
        impersonationEmail: conf("GSUITE_IMPERSONATION_EMAIL"),
    }
}

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
