import * as xero from "xero-node"
import * as fs from "fs"

export type InvoiceResultDto = {
    id: string,
    total: number
}
export type InvoiceDto = {
    InvoiceID?: string,
    Type: string,
    Date?: string,
    DueDate?: string,
    Contact: ContactDto,
    LineItems: LineItemDto[],
    Reference?: string,
}

export type ContactDto = {
    ContactID?: string
    Name?: string,
}

export type LineItemDto = {
    LineItemID?: string,
    AccountCode?: string,
    Description: string,
    UnitAmount: number,
    Quantity: number,
    TaxType: string,
    Tracking?: TrackingItemDto[],
}

export type TrackingItemDto = {
    Name: string,
    Option: string,
}

export type Config = {
    userAgent: string,
    consumerKey: string,
    consumerSecret: string,
    privateKeyPath?: string,
    privateKey?: string,
}

export const buildXeroClient = (config: Config) => {
    if (config.privateKeyPath && !config.privateKey) {
        config.privateKey = fs.readFileSync(config.privateKeyPath, "utf8")
    }
    return new xero.PrivateApplication(config)
}

export const buildXeroCreateInvoiceAdapter = (xeroClient: any) =>
    async (invoiceDto: InvoiceDto): Promise<InvoiceResultDto> => {
        const invoiceToBeSaved = xeroClient.core.invoices.newInvoice(invoiceDto)
        const result = await invoiceToBeSaved.save()
        return {
            id: result.entities[0]._obj.InvoiceID,
            total: result.entities[0].Total
        } as InvoiceResultDto
    }
