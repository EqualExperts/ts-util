import {
    GetGDriveFilesInFolderAdapter,
    buildGetGDriveFilesInFolderAdapter,
    MoveGDriveFileToFolderAdapter,
    buildMoveGDriveFileToFolderAdapter
 } from "./../../src/gsuite/driveAdapter"
import "jest"
import * as fs from "fs"
import * as path from "path"
import * as uuid from "uuid/v1"
import * as util from "util"
import { google } from "googleapis"

import { buildConfigAdapter } from "../../src/config/adapter"
import { buildGSuiteClient, GSuiteConfig, authorize } from "../../src/gsuite/client"

import { appendFileSync } from "fs"

let originalTimeout
let gSuiteConfig
const operationsFolderId = "15sWNHqufDU_s9zBqrdNd9MikIrPRIY1o"

beforeAll(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

    const config = loadConfig()
    gSuiteConfig = buildConfig(config)
})

describe("GDrive File Operations Adapter", async () => {

    it("Downloads files with content", async () => {
        // arrange
        const getGDriveFileInFolder: GetGDriveFilesInFolderAdapter = buildGetGDriveFilesInFolderAdapter(gSuiteConfig)

        // act
        const filepaths: string[] = await getGDriveFileInFolder(operationsFolderId)
        console.log("files downloaded to:", filepaths)

        // assert
        expect(filepaths).toBeTruthy()
        expect(filepaths).not.toHaveLength(0)

        for (const filepath of filepaths) {
            const buffer: Buffer = fs.readFileSync(filepath)
            expect(buffer).toBeTruthy()
            expect(buffer.length).toBeGreaterThan(0)
        }
    })

    xit("Moves file to folder", async () => {
        // arrange
        const fileId = "1cm_FWJbIhXJW-zimDVdcNgws0IKtts1v"
        const targetFolderId = "12Rlda86qYgU6XkAfKzt4wMp__DBRq09o"
        const moveGDriveFileToFolderAdapter: MoveGDriveFileToFolderAdapter =
            buildMoveGDriveFileToFolderAdapter(gSuiteConfig)

        // act
        const result: boolean = await moveGDriveFileToFolderAdapter(fileId, targetFolderId)

        // assert
        expect(result).toBeTruthy()
    })

})

async function loadConfigs() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive/gsuite-tempemail"

    if (fs.existsSync(keyBaseFilePath)) {
        // To run locally
        const credsFilePath = path.join(keyBaseFilePath, "gsuite.json")
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
        const gsuitePrivateKeyPath = path.join(secretDir, "gsuitepkey.pem")
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
