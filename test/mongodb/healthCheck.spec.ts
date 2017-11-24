import "jest"
import * as mongo from "mongodb"
import { MongoError } from "mongodb"
import { buildMongoHealthCheckAdapter } from "../../src/mongodb/healthCheck"
import {
    HealthCheckStatus,
    ServiceHealthCheck,
    OK,
    FAIL,
} from "../../src/healthCheck"

import { buildCollectionFactory, buildGetCollectionMongoAdapter } from "../../src/mongodb/adapter"

describe("MongoDB Adaptor", () => {
    it("returns healthcheck status as ok when mongo is running", async () => {
        // given
        const activeConnection = await createConnection("mongodb://localhost:27017/equalsoftware")
        const underTest: () => Promise<ServiceHealthCheck> = buildMongoHealthCheckAdapter(activeConnection)

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "mongo",
            status: OK,
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })

    it("returns healthcheck status as fail when mongo is not running", async () => {
        // given
        const closedConnection = await createConnection("mongodb://localhost:27017/equalsoftware")
        closedConnection.close()
        const underTest: () => Promise<ServiceHealthCheck> = buildMongoHealthCheckAdapter(closedConnection)

        // when
        const serviceHealthCheck: ServiceHealthCheck = await underTest()

        // then
        const expectedServiceHealthCheck = {
            name: "mongo",
            status: FAIL,
            reason: "Topology was destroyed",
        }
        expect(serviceHealthCheck).toEqual(expectedServiceHealthCheck)
    })
})

const createConnection = async (connectionString: string) => {
    return await mongo.MongoClient.connect(connectionString)
}
