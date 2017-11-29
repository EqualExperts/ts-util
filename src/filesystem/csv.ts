import { appendFile, appendFileSync } from "fs"
import * as nano from "nano-seconds"

export type FilePath = string
export type Entry = string
export type Header = string

export type ExportCsv =
    <T>(content: T[], headerTransformer: () => Header, transformer: (item: T) => Entry) => Promise<FilePath>

// TODO - (very very corner case scenario. as we are using a nano-seconds as a csv file prefix)
// since csv file is generated using current nano timestamp, if we access this from multiple machines,
// at the same time. It will append the content to the same file. We need to solve this if it is an issue.
export const exportCsv: ExportCsv =
    async <T>(content: T[], headerTransformer: () => Header, transformer: (item: T) => Entry): Promise<FilePath> => {
        const csvFileName = "/tmp/csv-" + nano.toISOString(nano.now()) + ".csv"

        appendFileSync(csvFileName, `${headerTransformer()}\n`)
        content.forEach((c) => {
            const item = `${transformer(c)}\n`
            appendFileSync(csvFileName, item)
        })
        return csvFileName
    }
