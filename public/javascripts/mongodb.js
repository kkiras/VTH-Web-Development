const { MongoClient, ObjectId } = require("mongodb");

const mongodbUrl = "mongodb://localhost:27017";
const dbName = "data-nhom";
const collectionName = "shoes";

let dbCollection;
let client;

async function connectToMongoDB() {
  try {
    client = await MongoClient.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    dbCollection = client.db(dbName).collection(collectionName);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err;
  }
}

async function closeMongoDBConnection() {
  if (client) {
    try {
      await client.close();
      console.log("Disconnected from MongoDB.");
      process.exit(0);
    } catch (error) {
      console.error("Failed to disconnect from MongoDB:", error);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
}

async function insertDocument(newShoes) {
  try {
    return Array.isArray(newShoes)
      ? await dbCollection.insertMany(newShoes)
      : await dbCollection.insertOne(newShoes);
  } catch (err) {
    console.error("Error inserting document:", err);
    throw err;
  }
}

async function findDocumentByName(name) {
  try {
    return await dbCollection.findOne({ name });
  } catch (err) {
    console.error("Error finding document by name:", err);
    throw err;
  }
}

async function findDocumentById(id) {
  try {
    return await dbCollection.findOne({ _id: new ObjectId(id) });
  } catch (err) {
    console.error("Error finding document by ID:", err);
    throw err;
  }
}

async function findDocumentByNameOrBrand(query) {
  try {
    return await dbCollection.find({
      $or: [
        { name: { $regex: query.nameOrBrand, $options: 'i' } },
        { brand: { $regex: query.nameOrBrand, $options: 'i' } }
      ]
    }).toArray();
  } catch (err) {
    console.error("Error finding documents by name or brand:", err);
    throw err;
  }
}

async function findDocumentsByIdOrName({ id, name }) {
  const query = {};
  if (id) query.id = id;
  if (name) query.name = { $regex: name, $options: 'i' };

  try {
    const results = await dbCollection.find(query).toArray();
    return results.map(doc => ({
      _id: doc._id,
      id: doc.id,
      name: doc.name,
      brand: doc.brand,
      price: doc.price,
      size: doc.size,
      color: doc.color,
      image: doc.image ? `/images/${doc.image}` : '/images/default.png'  // Ensure the image field is properly handled
    }));
  } catch (err) {
    console.error("Error finding documents by ID or name:", err);
    throw err;
  }
}

async function updateShoeById(id, updatedData) {
  try {
    const result = await dbCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    return result;
  } catch (err) {
    console.error("Error updating shoe by ID:", err);
    throw err;
  }
}

async function findDocument(query) {
    const documents = await dbCollection.find({
        $and: [
            {price: {
                $gte: parseFloat(query.priceMin) || 0,
                $lte: parseFloat(query.priceMax) || Infinity
            } },
            { size: {
                $in: query.size ? query.size : []
            } }
        ]
    }).toArray();
    return documents;
}
  


module.exports = {
  connectToMongoDB,
  closeMongoDBConnection,
  insertDocument,
  findDocumentByName,
  findDocumentById,
  findDocumentByNameOrBrand,
  findDocumentsByIdOrName,
  updateShoeById
};
