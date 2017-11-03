import * as mongo from "mongodb";
export interface IdDto {
    _id: string;
}
export declare const buildCollection: <T>(db: mongo.Db) => (collectionName: string) => mongo.Collection<T>;
export declare const buildGetCollectionMongoAdapter: <T>(collection: mongo.Collection<T>) => () => Promise<T[]>;
