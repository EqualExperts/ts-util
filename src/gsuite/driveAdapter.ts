import * as os from "os"
import * as fs from "fs"
import { authorize, GSuiteConfig, buildGSuiteClient } from "./client"
import { google } from "googleapis"
import * as path from "path"

export type GetGDriveFilesInFolderAdapter = (targetFolderId: string) => Promise<string[]>
export type BuildGetGDriveFilesInFolderAdapter = (gSuiteClient: any) => GetGDriveFilesInFolderAdapter
export type ReadGDriveFileAsyncHandler = (gdriveClient: any, fileId: string, fileName: string) => Promise<string>
export type GDriveFileMetaInfo = { id: string, name: string }

export const GDRIVE_SCOPES: string[] = ["https://www.googleapis.com/auth/drive.readonly"]
export const GDRIVE_VERSION = "v3"
export const GDRIVE_FINDFILESINFOLDER_PAGELIMIT = 100

export const buildGetGDriveFilesInFolderAdapter: BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES)
    return async (targetFolderId) => {
        await authorize(gsuiteClient)
        return getGDriveFilesInFolder(gsuiteClient, targetFolderId)
    }
}

export const getGDriveFilesInFolder = async (gSuiteClient: any, targetFolderId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    const getMaybeFiles = await new Promise<Array<Promise<string>>>((resolve, reject) => {
        gdrive.files.list(
            { pageSize: GDRIVE_FINDFILESINFOLDER_PAGELIMIT, q: `parents in '${targetFolderId}'` },
            (err: any, response: any) => {
                if (err) {
                    reject(err)
                }
                const files = response.data.files
                if (!files || files.length === 0) {
                    resolve([])
                }
                const maybeFiles: Array<Promise<string>> =
                    files.map((f: GDriveFileMetaInfo) => readGDriveFileAsync(gdrive, f.id, f.name))
                resolve(maybeFiles)
            })
    })
    return Promise.all(getMaybeFiles)
}

export const readGDriveFileAsync: ReadGDriveFileAsyncHandler = (gdriveClient, fileId, fileName) => {
    return new Promise<string>((resolve, reject) => {
        const fileGet = gdriveClient.files.get(
            { fileId: `${fileId}`, alt: "media" },
            { responseType: "stream" },
            (fgetError: any, fgetResp: any) => {
                if (fgetError) {
                    reject(fgetError)
                }
                const relativePath = path.join(os.tmpdir(), fileName)
                const dest = fs.createWriteStream(relativePath)
                    .on("finish", () => resolve(path.resolve(relativePath)))
                    .on("error", reject)
                fgetResp.data
                    .on("error", reject)
                    .pipe(dest)
            })
    })
}
