import "jest"
import * as fs from "fs"
import * as path from "path"
import * as uuid from "uuid/v1"
import * as util from "util"

import {
    GSuiteConfig,
    GSuiteListAccountOptions,
    GSuiteAccountCreatorAdapter,
    buildGSuiteClient,
    buildAccountCreatorAdapter,
    buildAccountRemoverAdapter,
    buildAccountCatalogAdapter
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

    xit("Creates an email account on GSuite", async () => {
        // given
        const gSuiteClient = await buildGSuiteClient(gSuiteConfig)
        const accountCreator: GSuiteAccountCreatorAdapter = buildAccountCreatorAdapter(gSuiteClient)

        const accountParams = {
            primaryEmail: randomEmail,
            name: {
                givenName: "Test 1",
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

    xit("Deletes an account on GSuite", async () => {
        // given
        const gSuiteClient = await buildGSuiteClient(gSuiteConfig)
        const accountRemover = buildAccountRemoverAdapter(gSuiteClient)

        const userEmail = randomEmail

        // when
        const result = await accountRemover(userEmail)

        // then
        expect(result).toEqual(true)
    })

    it("Lists accounts on GSuite", async () => {
        // given
        const gSuiteClient = await buildGSuiteClient(gSuiteConfig)
        const accountCatalog = buildAccountCatalogAdapter(gSuiteClient)

        // when
        const result = await accountCatalog(({
            domain: gSuiteConfig.organisation,
            maxResults: 500,
            showDeleted: false,
            viewType: "ADMIN_VIEW",
            fields: "users(id,isAdmin,name/fullName,primaryEmail)",
            projection: "full",
            orderBy: "email"
        }) as GSuiteListAccountOptions)

        expect(result).not.toBeNull()
        expect(result.length > 0).toBeTruthy()
    })
})

function loadConfigs() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const credsFilePath = path.join(keyBaseFilePath, "gsuite.json")
    const configFilePath = path.join(keyBaseFilePath, "gsuite-config.json")
    if (fs.existsSync(credsFilePath)) {
        const credsJson = JSON.parse(fs.readFileSync(credsFilePath, "utf-8").trim())
        process.env.GSUITE_CLIENT_EMAIL = credsJson.client_email
        process.env.GSUITE_PRIVATE_KEY = credsJson.private_key
    } else {
        const dirNameGSuitePrivateKeyFile = path.join(__dirname, "gsuite.pem")
        process.env.GSUITE_PRIVATE_KEY = fs.readFileSync(dirNameGSuitePrivateKeyFile, "utf8")
    }
    if (fs.existsSync(configFilePath)) {
        const configJson = JSON.parse(fs.readFileSync(configFilePath, "utf-8").trim())
        process.env.GSUITE_ACCOUNT_EMAIL_DOMAIN = configJson.organisation
        process.env.GSUITE_IMPERSONATION_EMAIL = configJson.impersonationEmail
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
        GSUITE_ACCOUNT_EMAIL_DOMAIN: {
            format: "*",
        }
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )
}

const buildConfig: (conf: (key: string) => string) => GSuiteConfig = (conf: (key: string) => string) => {
    return {
        clientEmail: conf("GSUITE_CLIENT_EMAIL"),
        privateKey: conf("GSUITE_PRIVATE_KEY"),
        impersonationEmail: conf("GSUITE_IMPERSONATION_EMAIL"),
        organisation: conf("GSUITE_ACCOUNT_EMAIL_DOMAIN")
    }
}

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
