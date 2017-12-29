import "jest"
import { readFile, readFileSync, appendFileSync } from "fs"
import { buildCsvExporter, CsvExporter } from "../../src/filesystem/csv"
import { appendFile } from "fs"

describe("Csv", () => {
    it("exports content to csv using separator defined in transformers", async () => {
        const content = [
            { name: "John Fraga", age: 30, height: 1.5 },
            { name: "Mary Perrera", age: 20, height: 3.2 },
        ]
        const headerTransformer: () => string = () => "Full Name,Age,Height"
        const itemTransformer: (obj: any) => string = (obj: any) => `${obj.name},${obj.age},${obj.height}`
        const exportCsv: CsvExporter<any> = buildCsvExporter(headerTransformer, itemTransformer)

        const csvContent = await exportCsv(content)

        expect(headersOf(csvContent)).toBe("Full Name,Age,Height")
        expect(firstEntryOf(csvContent)).toBe("John Fraga,30,1.5")
        expect(secondEntryOf(csvContent)).toBe("Mary Perrera,20,3.2")
    })
})

const headersOf = (csvContent: string) => readLine(csvContent, 0)

const firstEntryOf = (csvContent: string) => readLine(csvContent, 1)

const secondEntryOf = (csvContent: string) => readLine(csvContent, 2)

const readLine = (csvContent: string, lineNum: number) =>
    csvContent.split("\n")[lineNum]
