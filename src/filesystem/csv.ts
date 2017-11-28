import { appendFile, appendFileSync } from "fs"
import * as nano from "nano-seconds"

// TODO - (very very corner case scenario. as we are using a nano-seconds as a csv file prefix)
// since csv file is generated using current nano timestamp, if we access this from multiple machines,
// at the same time. It will append the content to the same file. We need to solve this if it is an issue.
export const exportCsv = async <T>(content: T[], transformer: (item: T) => string): Promise<string> => {
    const csvFileName = "/tmp/csv-" + nano.toISOString(nano.now()) + ".csv"
    content.forEach((c) => {
        const item = `${transformer(c)}\n`
        appendFileSync(csvFileName, item)
    })
    return csvFileName
}
