import * as path from "path"
import * as fs from "fs"
import * as mime from "mime-types"

export type FilePath = string

export type TransactionalEmailDetails = {
    smartEmailID: string,
    emailTo: string,
    emailPlaceholderValues: object,
    attachments: FilePath[]
}

type AttachmentInfo = {
    Content: string,
    Name: string,
    Type: string
}

type SmartEmailDetails = {
    smartEmailID: string,
    To: string,
    Data: object,
    Attachments: AttachmentInfo[]
}

export type CampaignMonitorConfig = {
    apiKey: string
}

export type SendTransactEmailResult = {
    Status: string,
    MessageID: string,
    Recipient: string
}

export type SendTransactEmailError = {
    Code: number,
    Message: string
}

export type BuildSendTransactionalEmailAdapter = (config: CampaignMonitorConfig) => SendTransactionalEmailAdapter
export type SendTransactEmailResponse = SendTransactEmailResult[] | SendTransactEmailError

export type SendTransactionalEmailAdapter =
    (emailDetails: TransactionalEmailDetails) => Promise<SendTransactEmailResponse>

export const buildSendTransactionalEmailAdapter: BuildSendTransactionalEmailAdapter = (config) => {
    const createsend = require("createsend-node")
    const client = new createsend(config)
    return async (emailDetails) =>
        await new Promise<SendTransactEmailResponse>((resolve, reject) => {
            const smartEmailDetails = buildSmartEmailDetails(emailDetails)
            client.transactional.sendSmartEmail(smartEmailDetails,
                (err: SendTransactEmailError, res: SendTransactEmailResult[]) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(res)
                })
        })
}

const buildAttachment = (attachmentPath: FilePath) => {
    if (!fs.existsSync(attachmentPath)) {
        throw new Error(`Failed to load attachment file. File not found: ${attachmentPath}`)
    }
    const data = fs.readFileSync(attachmentPath)
    const content = new Buffer(data).toString("base64")
    const filePath = path.parse(attachmentPath)
    return {
        Content: content,
        Name: filePath.base,
        Type: mime.lookup(filePath.ext)
    } as AttachmentInfo
}

const buildSmartEmailDetails = (emailDetails: TransactionalEmailDetails) => {
    const attachments: AttachmentInfo[] = emailDetails.attachments.map(buildAttachment)
    return {
        smartEmailID: emailDetails.smartEmailID,
        To: emailDetails.emailTo,
        Data: emailDetails.emailPlaceholderValues,
        Attachments: attachments
    } as SmartEmailDetails
}
