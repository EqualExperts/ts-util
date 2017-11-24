import { ServiceHealthCheckAdapter, OK, FAIL } from "../healthCheck"
import * as mongo from "mongodb"
import { Collection } from "mongodb"

export const buildMongoHealthCheckAdapter: (connection: mongo.Db) => ServiceHealthCheckAdapter =
(connection: mongo.Db) =>
    () => {
        return connection.collections()
            .then(
            (coll) => ({ name: "mongo", status: OK }))
            .catch(
            (err: mongo.MongoError) => ({ name: "mongo", status: FAIL, reason: err.message }))
    }
