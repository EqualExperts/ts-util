import "jest"
import { buildXeroClient, buildXeroCreateInvoiceAdapter, InvoiceDto, Config } from "../../src/xero/invoiceAdapter"
import * as path from "path"
import fs = require("fs")
import { buildConfigAdapter } from "../../src/config/adapter"

let xeroClient: any

beforeAll(() => {
    prepareProcessEnvVars()

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

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
        privateKey: fs.readFileSync(envVars("XERO_PRIVATE_KEY_PATH"), "utf8"),
    }

    xeroClient = buildXeroClient(config)
})

describe("Invoice Adapter", () => {
    it("creates an invoice", async () => {
        // whenadd
        const createInvoiceAdapter = buildXeroCreateInvoiceAdapter(xeroClient)

        const invoiceDto: InvoiceDto = {
            Type: "ACCREC",
            Contact: { ContactID: "6295e95a-24c5-4c75-891d-ab085cbf0b3c" },
            Date: "2018-01-01",
            DueDate: "2018-01-30",
            LineItems: [{
                Description: "Richard Davie Hamilthon - December 2017",
                Quantity: 20,
                UnitAmount: 495.00,
                TaxType: "OUTPUT2",
            }],
            Reference: "PO 1234567",
        }

        const result = await createInvoiceAdapter(invoiceDto)

        // then
        expect(result).toBeTruthy() // containsAnId
    })
})

function prepareProcessEnvVars() {
    const dirNameXeroPrivateKeyFile = path.join(__dirname, "privatekey.pem")

    const keyBaseFilePath = "/keybase/team/ee_software/aslive/xero-credentials"
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
