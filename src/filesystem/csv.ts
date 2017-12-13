import { appendFile, appendFileSync } from "fs"
import * as nano from "nano-seconds"

export type FilePath = string
export type Entry = string
export type Header = string

export type CsvExporter<T> =
    (content: T[]) => Promise<FilePath>

export type BuildCsvExporter = <T>(headerTransformer: () => Header, transformer: (item: T) => Entry) =>
    CsvExporter<T>

// TODO: (very very corner case scenario. as we are using a nano-seconds as a csv file prefix)
// since csv file is generated using current nano timestamp, if we access this from multiple machines,
// at the same time. It will append the content to the same file. We need to solve this if it is an issue.
// Use UUID to solve this problem
export const buildCsvExporter: BuildCsvExporter =
    (headerTransformer, transformer) => {
        return async (content) => {
            const csvFileName = "/tmp/csv-" + nano.toISOString(nano.now()) + ".csv"
            log("csvFileName-" + csvFileName)
            log("headers-" + `${headerTransformer()}\n`)
            appendFileSync(csvFileName, `${headerTransformer()}\n`)
            log("headers appended....")
            content.forEach((c) => {
                log("append entry")
                const item = `${transformer(c)}\n`
                log("append entry --- " + item)
                appendFileSync(csvFileName, item)
            })
            log("everything completed.... ")
            return csvFileName
        }
    }

function log(msg: string) {
    appendFileSync("/tmp/jest.log.txt", new Date() + " - " + msg + "\n", { encoding: "utf8" })
}
