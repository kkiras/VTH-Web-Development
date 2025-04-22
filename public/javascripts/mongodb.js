const { MongoClient, ObjectId } = require("mongodb");

const mongodbUrl = "mongodb://localhost:27017";
const dbName = "mydb";
const collectionName = "shoes-2";

let dbCollection;
let client;

async function connectToMongoDB() {
  try {
    client = await MongoClient.connect(mongodbUrl);
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

async function findDocumentsByName(name) {
  try {
    console.log("Finding documents by name:", name);
    return await dbCollection.find({ name: { $regex: name, $options: 'i' } }).toArray();
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
    const filters = [];

    const sizes = Array.isArray(query.size)
    ? query.size
    : query.size
    ? [query.size]
    : [];

    filters.push({
        price: {
            $gte: parseFloat(query.priceMin) || 0,
            $lte: parseFloat(query.priceMax) || Infinity
        }
    });

    if (sizes > 0) {
        filters.push({
            size: sizes.length === 1 ? sizes[0] : { $in: sizes }
        });
        
    }

    if (query.brand && query.brand.trim() !== "") {
        filters.push({
            brand: {
                $regex: query.brand,
                $options: 'i'
            }
        });
    }

    if (query.nameOrBrand && query.nameOrBrand.trim() !== "") {
        filters.push({
            name: { 
                $regex: query.nameOrBrand, 
                $options: 'i' 
            } 
        });
    }

    const mongoQuery = filters.length > 0 ? { $and: filters } : {};

    const documents = await dbCollection.find(mongoQuery).toArray();
    return documents;
}
  


module.exports = {
  connectToMongoDB,
  closeMongoDBConnection,
  insertDocument,
  findDocumentsByName,
  findDocumentById,
  findDocumentByNameOrBrand,
  findDocumentsByIdOrName,
  updateShoeById,
    findDocument,
};
