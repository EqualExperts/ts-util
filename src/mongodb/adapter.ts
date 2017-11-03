import * as mongo from "mongodb"
import { Collection } from "mongodb"

export interface IdDto {
    _id: string
}

// Generic Mongo Collection Builders
export type CollectionBuilder<T> = (collectionName: string) => Collection<T>

export const buildCollection = <T>(db: mongo.Db) =>
    (collectionName: string) => db.collection<T>(collectionName)

export const buildGetCollectionMongoAdapter = <T>(collection: Collection<T>) =>
    () => collection.find<T>().toArray()
