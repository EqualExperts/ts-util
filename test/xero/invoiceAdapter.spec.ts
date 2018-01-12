import "jest"
import { buildXeroClient, buildXeroCreateInvoiceAdapter, InvoiceDto, Config } from "../../src/xero/invoiceAdapter"
import * as path from "path"
import fs = require("fs")
import { buildConfigAdapter } from "../../src/config/adapter"

let xeroClient: any

beforeAll(() => {
    prepareProcessEnvVars()

    const envVars = buildConfigAdapter({
        XERO_CONSUMER_KEY: {},
        XERO_CONSUMER_SECRET: {},
        XERO_PRIVATE_KEY_PATH: {},
    }).getOrElse(
        (wrongConfigMessage) => { throw new Error(wrongConfigMessage) },
    )

    const config: Config = {
        userAgent: "XERO_INTEGRATION_TESTS",
        consumerKey: envVars("XERO_CONSUMER_KEY"),
        consumerSecret: envVars("XERO_CONSUMER_SECRET"),
        privateKeyPath: envVars("XERO_PRIVATE_KEY_PATH"),
    }
    xeroClient = buildXeroClient(config)
})

describe("Invoice Adapter", () => {
    it("creates an invoice", async () => {
        // when
        const createInvoiceAdapter = buildXeroCreateInvoiceAdapter(xeroClient)

        const invoiceDto: InvoiceDto = {
            Type: "ACCREC",
            Contact: { ContactID: "3cbd5263-0965-4c4e-932c-bf50e3297610" },
            Date: "2018-01-01",
            DueDate: "2018-01-30",
            LineItems: [{
                Description: "Richard Davie Hamilthon - December 2017",
                Quantity: 20,
                UnitAmount: 495.00,
                TaxType: "TAX002",
            }, {
                Description: "Leena Davis - December 2017",
                Quantity: 10,
                UnitAmount: 600.00,
                TaxType: "TAX002",
            }, {
                Description: "Shabana Begum - December 2017",
                Quantity: 17,
                UnitAmount: 750.00,
                TaxType: "TAX002",
            }],
            Reference: "PO 1234567",
        }

        const result = await createInvoiceAdapter(invoiceDto)

        // then
        expect(result).toBeTruthy() // containsAnId
    })
})

function prepareProcessEnvVars() {
    const dirNameXeroPrivateKeyFile = path.join(__dirname, "privatekey.pem.enc")

    const keyBaseFilePath = "/keybase/team/ee_software/test/xero-credentials"
    const keybaseXeroPrivateKeyFile = path.join(keyBaseFilePath, "privatekey.pem")
    const xeroConsumerKeyFile = path.join(keyBaseFilePath, "consumer-key.txt")
    const xeroConsumerSecretFile = path.join(keyBaseFilePath, "consumer-secret.txt")

    if (fs.existsSync(xeroConsumerKeyFile) && fs.existsSync(xeroConsumerSecretFile)) {
        process.env.XERO_CONSUMER_KEY = fs.readFileSync(xeroConsumerKeyFile, "utf-8")
        process.env.XERO_CONSUMER_SECRET = fs.readFileSync(xeroConsumerSecretFile, "utf-8")
    }
    if (fs.existsSync(dirNameXeroPrivateKeyFile)) {
        process.env.XERO_PRIVATE_KEY_PATH = dirNameXeroPrivateKeyFile
    }
    if (fs.existsSync(keybaseXeroPrivateKeyFile)) {
        process.env.XERO_PRIVATE_KEY_PATH = keybaseXeroPrivateKeyFile
    }
}
