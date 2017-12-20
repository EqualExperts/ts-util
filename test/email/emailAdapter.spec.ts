import "jest"
import {
    SMTPConfig,
    Email,
    EmailAdapter,
    buildEmailAdapter,
} from "../../src/email/emailAdapter"

describe("Email Adapter", () => {
    // TODO - This is excluded because we need to setup test SMTP server
    xit("emails to given address", async () => {
        const email = {
            from: "john@abc.com",
            to: "mary@xyz.com",
            subject: `salary review`,
            body: "salary statement",
        } as Email

        const underTest: EmailAdapter = buildEmailAdapter(fakeSMTPConfig)

        const status = await underTest(email)

        expect(status.accepted.length).toBe(1)
    })
})

const fakeSMTPConfig = {
    server: "smtp_server",
    port: 999,
    userName: "smtp_username",
    password: "smtp_password",
} as SMTPConfig
