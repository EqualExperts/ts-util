import "jest"
import { buildXeroClient, buildCreateInvoiceAdapter, InvoiceDto, Config } from "../../src/xero/invoiceAdapter"
import * as path from "path"

let xeroClient: any

beforeAll(() => {
    const pemPath = path.join(__dirname, "xero-int-test-privatekey.pem")
    const config: Config = {
        userAgent: "XERO_INTEGRATION_TESTS",
        consumerKey: "MX7882OECQWAPJUC6F6TAZZWWP8K2O",
        consumerSecret: "UQYQKKPXRAVZGYMBL9DQVNPJVO9XQF",
        privateKeyPath: pemPath,
        privateKey: "",
    }
    xeroClient = buildXeroClient(config)
})

describe("Invoice Adapter", () => {
    it("should create invoice", async () => {
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
