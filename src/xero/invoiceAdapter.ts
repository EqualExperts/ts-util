import * as xero from "xero-node"
import * as fs from "fs"

export type InvoiceDto = {
    InvoiceID?: string,
    Type: string,
    Contact: ContactDto,
    LineItems: LineItemDto[],
}

export type ContactDto = {
    ContactID?: string
    Name: string,
}

export type LineItemDto = {
    LineItemID?: string,
    AccountCode: string,
    Description: string,
    UnitAmount: number,
    Quantity: number,
}

export const buildXeroClient = (config: any) => {
    if (config.privateKeyPath && !config.privateKey) {
        config.privateKey = fs.readFileSync(config.privateKeyPath, "utf8")
    }
    return new xero.PrivateApplication(config)
}

export const buildCreateInvoiceAdapter = (xeroClient: any) => {
    return (invoiceDto: InvoiceDto) => {
        const invoiceToBeSaved = xeroClient.core.invoices.newInvoice(invoiceDto)
        return invoiceToBeSaved.save()
    }
}
