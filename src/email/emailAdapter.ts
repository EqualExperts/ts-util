
import * as nodemailer from "nodemailer"
import { MailOptions, SentMessageInfo } from "nodemailer/lib/smtp-pool"
import { appendFileSync } from "fs"
import * as log4js from "log4js"

export type EmailAdapter = (email: Email) => Promise<boolean>
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
    attachmentName?: string,
    attachmentContent?: string,
}

export const buildEmailAdapter: BuildEmailAdapter =
    (smtpConfig) => (email) => {
        // TODO : Think if we want to create a createTransporter everytime
        // Or like mongo connection we should create only once
        const log = log4js.getLogger()
        const transporter = createTransporter(smtpConfig)
        const mailOptions = buildMailOptions(email)
        return transporter.sendMail(mailOptions).then(
            (sentMessageInfo: SentMessageInfo) => {
                log.info("Email sent status " + JSON.stringify(sentMessageInfo))
                return (sentMessageInfo.accepted.length >= 1 ? Promise.resolve(true) : Promise.resolve(false))
            }
        )
    }

const buildMailOptions = (email: Email): MailOptions => {
    const mailOptions: MailOptions = {
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.body,
    }
    if (email.attachmentName) {
        mailOptions.attachments = [
            {
                filename: email.attachmentName,
                content: email.attachmentContent,
            },
        ]
    }
    return mailOptions
}

const createTransporter = (smtpConfig: SMTPConfig) => (
    nodemailer.createTransport({
        host: smtpConfig.server,
        port: smtpConfig.port,
        debug: true,
        auth: {
            user: smtpConfig.userName,
            pass: smtpConfig.password,
        },
    })
)
