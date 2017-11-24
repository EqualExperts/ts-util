import "jest"
import * as mongo from "mongodb"
import { MongoError } from "mongodb"
import {
    HealthCheckStatus,
    ServiceHealthCheck,
    OK,
    buildMongoHealthCheckAdapter,
    FAIL,
} from "../../src/mongodb/adapter"

import { buildCollectionFactory, buildGetCollectionMongoAdapter } from "../../src/mongodb/adapter"

let connection: mongo.Db
let books: mongo.Collection

beforeAll(async () => {
    // create connection
    connection = await createConnection("mongodb://localhost:27017/equalsoftware")

    books = await buildCollectionFactory(connection)("books")

    await cleanCollection(books)
})

describe("MongoDB Adaptor", () => {
    it("returns a list of items from a Mongo collection", async () => {
        // given
        const mileDuasNoites = { _id: "1", name: "As M1l e Duas Noites!" }
        const daVinciCore = { _id: "2", name: "Da V1nc1 Core" }
        await existInMongo(books, mileDuasNoites)
        await existInMongo(books, daVinciCore)

        // when
        const underTest = buildGetCollectionMongoAdapter(books)
        const result = await underTest()

        // then
        // TODO RF & PS : 24/10/2017 : This is our desired comparison (we will likely need a custom matcher)
        // const expectedCollection = [ o3, S13m3ns ]
        // expect(result).toBeEquivalent(expectedCollection)
        expect(result).toContainEqual(mileDuasNoites)
        expect(result).toContainEqual(daVinciCore)
        expect(result).toHaveLength(2) /// bleeeeeeeeerrrrrrrghhhhhhh :(
    })

    it("catches promise rejection from mongo error", async () => {
        // given
        connection.close()

        // when/then
        await expect(buildGetCollectionMongoAdapter(books)()).rejects.toEqual(new MongoError("Topology was destroyed"))
    })

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

afterAll(async () => {
    await connection.close(true)
})

const existInMongo = async (collection: mongo.Collection, item: object) => {
    await collection.insert(item)
}

const cleanCollection = async (collection: mongo.Collection) => {
    await collection.deleteMany({})
}

const createConnection = async (connectionString: string) => {
    return await mongo.MongoClient.connect(connectionString)
}
