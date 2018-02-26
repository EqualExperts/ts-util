import "jest"
import * as fs from "fs"
import * as path from "path"
import * as uuid from "uuid/v1"
import * as util from "util"
import * as tar from "tar-fs"
import * as decompress from "decompress"
import * as decompressTar from "decompress-tar"


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
        // givenddd
        const gSuiteClient = await buildGSuiteClient(gSuiteConfig)
        const accountCreator: GSuiteAccountCreatorAdapter = buildAccountCreatorAdapter(gSuiteClient)

        const accountParams = {
            primaryEmail: randomEmail,
            name: {
                givenName: "Test5",
                familyName: "User5",
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
    const keyBaseFilePath = "/keybase/team/ee_software/aslive/gsuite-tempemail"
    const credsFilePath = path.join(keyBaseFilePath, "gsuite.json")

    if (fs.existsSync(credsFilePath)) {
        // To run locally
        const credsJson = JSON.parse(fs.readFileSync(credsFilePath, "utf-8").trim())
        process.env.GSUITE_CLIENT_EMAIL = credsJson.client_email
        process.env.GSUITE_PRIVATE_KEY = credsJson.private_key

        const configFilePath = path.join(keyBaseFilePath, "gsuite-config.json")
        const configJson = JSON.parse(fs.readFileSync(configFilePath, "utf-8").trim())
        process.env.GSUITE_ACCOUNT_EMAIL_DOMAIN = configJson.organisation
        process.env.GSUITE_IMPERSONATION_EMAIL = configJson.impersonationEmail

    } else {
        // To run on travis
        const secretDir = path.join(__dirname, "../secrets")
        if (fs.existsSync(secretDir)) {
            console.log(secretDir + " exists")
        }
        const travisSecreteTar = path.join(secretDir, "secrets.tar.gz")
        if (fs.existsSync(travisSecreteTar)) {
            console.log(travisSecreteTar + " exists")
        }

        const gsuitePrivateKeyPath = path.join(secretDir, "gsuitepkey.pem")
        if (!fs.existsSync(gsuitePrivateKeyPath)) {
            console.log("extra tar file....")
            console.log("tar file extracted to ..." + secretDir)
            console.log("tar file extracted to ..." + travisSecreteTar)
            decompress(travisSecreteTar, secretDir, {
                plugins: [
                    decompressTar()
                ]
            }).then(() => {
                console.log("decompressed is successfull")
            })
        }
        if (fs.existsSync(gsuitePrivateKeyPath)) {
            console.log(gsuitePrivateKeyPath + " exists")
        }

        process.env.GSUITE_PRIVATE_KEY = fs.readFileSync(gsuitePrivateKeyPath, "utf8")
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
