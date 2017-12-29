import { appendFile, appendFileSync } from "fs"

export type Entry = string
export type Header = string
export type CsvContent = string

export type CsvExporter<T> =
    (content: T[]) => Promise<CsvContent>

export type BuildCsvExporter = <T>(headerTransformer: () => Header, transformer: (item: T) => Entry) =>
    CsvExporter<T>

export const buildCsvExporter: BuildCsvExporter =
    (headerTransformer, transformer) => {
        return async (content) => {
            const csvHeader = `${headerTransformer()}\n`
            return content.reduce(
                (csvContent, curCsvEntry) => csvContent + `${transformer(curCsvEntry)}\n`,
                csvHeader,
            )
        }
    }

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
