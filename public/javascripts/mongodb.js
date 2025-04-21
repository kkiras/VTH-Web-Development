const { MongoClient } = require("mongodb");

const mongodbUrl = "mongodb://localhost:27017";
const dbName = "data-nhom"
const collectionName = "shoes";

let dbCollection;
let client;

async function connectToMongoDB() {
    try {
        client = await MongoClient.connect(mongodbUrl)
        dbCollection = client.db(dbName).collection(collectionName);
    } catch (err) {
        throw err;
    }
}

async function closeMongoDBConnection() {
    if (client) {
        await client.close()
            .then(() => {
                console.log("Disconnected from MongoDB.");
                process.exit(0);
            })
            .catch(error => {
                console.error("Faild to disconnect from MongoDB:", error);
                process.exit(1);
            })
    } else {
        process.exit(0);
    }
}

async function insertDocument(newShoes) {
    const result = Array.isArray(newShoes) 
        ? await dbCollection.insertMany(newShoes) 
        : await dbCollection.insertOne(newShoes);
    return result;
}

async function findDocumentByName(query) {
    const documents = await dbCollection.findOne({query});
    return documents;

}

async function findDocumentByNameOrBrand(query) {
    const documents = await dbCollection.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } }
      ]
    }).toArray();
  
    return documents;
}
  

module.exports = {
    connectToMongoDB,
    closeMongoDBConnection,
    insertDocument,
    findDocumentByName,
    findDocumentByNameOrBrand
};

