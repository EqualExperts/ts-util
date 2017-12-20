
import * as nodemailer from "nodemailer"
import { MailOptions, SentMessageInfo } from "nodemailer/lib/smtp-pool"

export type EmailAdapter = (email: Email) => Promise<SentMessageInfo>
export type BuildEmailAdapter = (smtpConfig: SMTPConfig) => EmailAdapter
export type SMTPConfig = {
    server: string,
    port: number,
    userName: string,
    password: string,
}
export type Email = {
    from: string,
    to: string,
    subject: string,
    body: string,
}

export const buildEmailAdapter: BuildEmailAdapter =
    (smtpConfig) => (email) => {
        // TODO - think if we want to create a createTransporter everytime
        // Or like mongo connection we should create only once
        const transporter = createTransporter(smtpConfig)
        const mailOptions = buildMailOptions(email)
        return transporter.sendMail(mailOptions)
    }

const buildMailOptions = (email: Email) => (
    {
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.body,
    } as MailOptions
)

const createTransporter = (smtpConfig: SMTPConfig) => (
    nodemailer.createTransport({
        host: smtpConfig.server,
        port: smtpConfig.port,
        auth: {
            user: smtpConfig.userName,
            pass: smtpConfig.password,
        },
    })
)
