import * as mongo from "mongodb"
import { Collection } from "mongodb"

export interface IdDto {
    _id: string
}

export enum HealthCheckStatus {
    OK = "OK",
    FAIL = "FAIL",
}
export const FAIL = HealthCheckStatus.FAIL
export const OK = HealthCheckStatus.OK

export type ServiceHealthCheck = {
    name: string,
    status: HealthCheckStatus,
    reason?: string,
}

// Generic Mongo Collection Builders
export type CollectionFactory<T> = (collectionName: string) => Collection<T>

export const buildCollectionFactory = <T>(db: mongo.Db) =>
    (collectionName: string) => db.collection<T>(collectionName)

export const buildGetCollectionMongoAdapter = <T>(collection: Collection<T>) =>
    () => collection.find<T>().toArray()

export const buildMongoHealthCheckAdapter: (connection: mongo.Db) => () => Promise<ServiceHealthCheck> =
    (connection: mongo.Db) =>
        () => {
            return connection.collections()
                .then(
                (coll) => ({ name: "mongo", status: OK }))
                .catch(
                (err: mongo.MongoError) => ({ name: "mongo", status: FAIL, reason: err.message }))
        }
