import "jest"
import * as fs from "fs"
import * as path from "path"
import {
    SMTPConfig,
    Email,
    EmailAdapter,
    buildEmailAdapter,
} from "../../src/email/emailAdapter"
import { appendFileSync } from "fs"

beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000
    prepareProcessEnvVars()
})
describe("Email Adapter", () => {
    it("emails to given address", async () => {
        const underTest: EmailAdapter = buildEmailAdapter(smtpConfig())
        const status = await underTest(salaryReviewEmail())

        expect(status).toBe(true)
    })
})

const salaryReviewEmail = (): Email => (
    {
        from: process.env.RECONCILIATION_REPORT_FROM_EMAIL,
        to: process.env.RECONCILIATION_REPORT_TO_EMAIL,
        subject: "salary review for Marie",
        body: "salary increment 15%",
        attachmentName: "salary.csv",
        attachmentContent: "Annual Appraisal,15% Increment",
    }
)

const smtpConfig = () => (
    {
        server: process.env.SMTP_SERVER,
        port: Number(process.env.SMTP_PORT),
        userName: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
    } as SMTPConfig
)

const smtpJsonConfig = () => {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const smtpConfigFilePath = path.join(keyBaseFilePath, "email.json")
    return JSON.parse(fs.readFileSync(smtpConfigFilePath, "utf-8").trim())
}

function prepareProcessEnvVars() {
    const keyBaseFilePath = "/keybase/team/ee_software/aslive"
    const smtpConfigFilePath = path.join(keyBaseFilePath, "email.json")

    if (fs.existsSync(smtpConfigFilePath)) {
        const smtpJson = JSON.parse(fs.readFileSync(smtpConfigFilePath, "utf-8").trim())
        log("smtpJson " + JSON.stringify(smtpJson))
        process.env.SMTP_SERVER = smtpJson.SMTP_SERVER
        process.env.SMTP_PORT = smtpJson.SMTP_PORT
        process.env.SMTP_USERNAME = smtpJson.SMTP_USERNAME
        process.env.SMTP_PASSWORD = smtpJson.SMTP_PASSWORD
        process.env.RECONCILIATION_REPORT_FROM_EMAIL = smtpJson.RECONCILIATION_REPORT_FROM_EMAIL
        process.env.RECONCILIATION_REPORT_TO_EMAIL = smtpJson.RECONCILIATION_REPORT_TO_EMAIL
    }
}

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
