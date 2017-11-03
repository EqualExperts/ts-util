import * as mongo from "mongodb";
import { Collection } from "mongodb";
export interface IdDto {
    _id: string;
}
export declare type CollectionFactory<T> = (collectionName: string) => Collection<T>;
export declare const buildCollectionFactory: <T>(db: mongo.Db) => (collectionName: string) => mongo.Collection<T>;
export declare const buildGetCollectionMongoAdapter: <T>(collection: mongo.Collection<T>) => () => Promise<T[]>;
