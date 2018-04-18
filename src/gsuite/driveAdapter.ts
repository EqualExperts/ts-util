import * as os from "os"
import * as fs from "fs"
import { authorize, GSuiteConfig, buildGSuiteClient } from "./client"
import { google } from "googleapis"
import * as path from "path"

export type GetGDriveFilesInFolderAdapter = (targetFolderId: string) => Promise<string[]>
export type BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => GetGDriveFilesInFolderAdapter
export type ListGDriveFilesInFolderAdapter = (folderId: string) => Promise<string[]>
export type BuildListGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => ListGDriveFilesInFolderAdapter
export type MoveGDriveFileToFolderAdapter = (fileId: string, targetFolderId: string) => Promise<boolean>
export type BuildMoveGDriveFileToFolderAdapter = (gSuiteConfig: GSuiteConfig) => MoveGDriveFileToFolderAdapter
export type UpdateGDriveFileParentFolderAdapter =
    (fileId: string, currentParentIds: string[], targetFolderId: string) => Promise<boolean>
export type BuildUpdateGDriveFileParentFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => UpdateGDriveFileParentFolderAdapter
export type ReadGDriveFileAsyncHandler = (gdriveClient: any, fileId: string, fileName: string) => Promise<string>
export type GDriveFileMetaInfo = { id: string, name: string }

export const GDRIVE_SCOPES_READ: string[] = ["https://www.googleapis.com/auth/drive.readonly"]
export const GDRIVE_SCOPES_WRITE: string[] = ["https://www.googleapis.com/auth/drive"]
export const GDRIVE_VERSION = "v3"
export const GDRIVE_FINDFILESINFOLDER_PAGELIMIT = 100

export const buildGetGDriveFilesInFolderAdapter: BuildGetGDriveFilesInFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
    return async (targetFolderId) => {
        await authorize(gsuiteClient)
        return getGDriveFilesInFolder(gsuiteClient, targetFolderId)
    }
}

export const buildListGDriveFilesInFolderAdapter: BuildListGDriveFilesInFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_READ)
        return async (folderId) => {
            await authorize(gsuiteClient)
            return listGDriveFilesInFolder(gsuiteClient, folderId)
        }
    }

export const buildMoveGDriveFileToFolderAdapter: BuildMoveGDriveFileToFolderAdapter = (gSuiteConfig: GSuiteConfig) => {
    const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_WRITE)
    return async (fileId, targetFolderId) => {
        await authorize(gsuiteClient)
        return moveGDriveFileToFolder(gsuiteClient, fileId, targetFolderId)
    }
}

export const buildUpdateGDriveFileParentFolderAdapter: BuildUpdateGDriveFileParentFolderAdapter =
    (gSuiteConfig: GSuiteConfig) => {
        const gsuiteClient = buildGSuiteClient(gSuiteConfig, GDRIVE_SCOPES_WRITE)
        return async (fileId, currentParentIds, targetFolderId) => {
            await authorize(gsuiteClient)
            return updateGDriveFileParentFolder(gsuiteClient, fileId, currentParentIds, targetFolderId)
        }
    }

const getGDriveFilesInFolder = async (gSuiteClient: any, targetFolderId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    const getMaybeFiles = await new Promise<Array<Promise<string>>>((resolve, reject) => {
        gdrive.files.list(
            {
                pageSize: GDRIVE_FINDFILESINFOLDER_PAGELIMIT,
                q: `parents in '${targetFolderId}' and trashed != true`,
                fields: "files(id, name, trashed)"
            },
            (err: any, response: any) => {
                if (err) {
                    reject(err)
                }
                const files = response.data.files
                if (!files || files.length === 0) {
                    resolve([])
                }
                const maybeFiles: Array<Promise<string>> =
                    files.map((f: GDriveFileMetaInfo) => {
                        return readGDriveFileAsync(gdrive, f.id, f.name)
                    })
                resolve(maybeFiles)
            })
    })
    return Promise.all(getMaybeFiles)
}

const readGDriveFileAsync: ReadGDriveFileAsyncHandler = (gdriveClient, fileId, fileName) => {
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

const listGDriveFilesInFolder = (gSuiteClient: any, targetFolderId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    return new Promise<any[]>((resolve, reject) => {
        gdrive.files.list(
            {
                pageSize: GDRIVE_FINDFILESINFOLDER_PAGELIMIT,
                q: `parents in '${targetFolderId}' and trashed != true`,
                fields: "files(id, mimeType, name, fileExtension, size, trashed, createdTime, modifiedTime, parents)"
            },
            (err: any, response: any) => {
                if (err) {
                    reject(err)
                }
                resolve(response.data.files)
            })
    })
}

const getGDriveFile = (gSuiteClient: any, fileId: string) => {
    const gdrive = google.drive({
        version: GDRIVE_VERSION,
        auth: gSuiteClient
    })
    return new Promise<any>((resolve, reject) => {
        gdrive.files.get({
            fileId,
            fields: "id, mimeType, name, fileExtension, size, trashed, createdTime, modifiedTime, parents",
        }, (err: any, result: any) => {
            if (err) {
            return reject(err)
            }
            resolve(result.data)
        })
    })
}

const updateGDriveFileParentFolder =
    (gSuiteClient: any, fileId: string, currentParentIds: string[], targetFolderId: string) => {
        const gdrive = google.drive({
            version: GDRIVE_VERSION,
            auth: gSuiteClient
        })
        return new Promise<boolean>((resolve, reject) => {
            const previousParents = currentParentIds.join(",")
            gdrive.files.update({
                fileId,
                addParents: targetFolderId,
                removeParents: previousParents,
                fields: "id, parents"
            }, (err: any) => {
                if (err) {
                    return reject(err)
                }
                resolve(true)
            })
        })
}

const moveGDriveFileToFolder = async (gSuiteClient: any, fileId: string, targetFolderId: string) => {
    const file = await getGDriveFile(gSuiteClient, fileId)
    return await updateGDriveFileParentFolder(gSuiteClient, fileId, file.parents, targetFolderId)
}
