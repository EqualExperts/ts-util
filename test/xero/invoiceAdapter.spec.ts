import "jest"
import { buildXeroClient, buildCreateInvoiceAdapter, InvoiceDto, Config } from "../../src/xero/invoiceAdapter"
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
    xit("creates an invoice", async () => {
        // when
        const createInvoiceAdapter = buildCreateInvoiceAdapter(xeroClient)
        const invoiceDto: InvoiceDto = {
            Type: "ACCPAY",
            Contact: { Name: "Mary" },
            LineItems: [{
                Description: "Monthly rental for property at 56a Wilkins Avenue",
                Quantity: 6,
                UnitAmount: 495.00,
                AccountCode: "200",
            }],
        }
        const result = await createInvoiceAdapter(invoiceDto)

        // then
        expect(result).toBeTruthy() // containsAnId
    })
})

function prepareProcessEnvVars() {

    const keyBaseFilePath = "/keybase/team/ee_software/aslive"

    const dirNameXeroPrivateKeyFile = path.join(__dirname, "xero-int-test-privatekey.pem")
    const keybaseXeroPrivateKeyFile = path.join(keyBaseFilePath, "xero-int-test-privatekey.pem")
    const xeroConsumerKeyFile = path.join(keyBaseFilePath, "xero-consumer-key.txt")
    const xeroConsumerSecretFile = path.join(keyBaseFilePath, "xero-consumer-secret.txt")

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
