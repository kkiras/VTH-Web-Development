const e = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const mongodbUrl = "mongodb://localhost:27017";
const dbName = "data-nhom";
const collectionName = "shoes-6";

const imageShoeCollection = "shoes-image";

const JSONimportCollection = "shoes-json";

let dbCollection;
let client;
let imageShoeCollectionDB;
let jsonImportCollectionDB;

async function connectToMongoDB() {
  try {
    client = await MongoClient.connect(mongodbUrl);
    dbCollection = client.db(dbName).collection(collectionName);
    imageShoeCollectionDB = client.db(dbName).collection(imageShoeCollection);
    jsonImportCollectionDB = client.db(dbName).collection(JSONimportCollection);
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

async function findAllDocuments(condition) {
  try {
    let cursor;
    switch (condition) {
      case "name-asc":
        cursor = dbCollection.find({}).sort({ name: 1 });
        break;
      case "name-desc":
        cursor = dbCollection.find({}).sort({ name: -1 });
        break;
      case "price-asc":
        cursor = dbCollection.find({}).sort({ price: 1 });
        break;
      case "price-desc":
        cursor = dbCollection.find({}).sort({ price: -1 });
        break;
      case "stock-asc":
        cursor = dbCollection.find({}).sort({ stock: 1 });
        break;
      case "stock-desc":
        cursor = dbCollection.find({}).sort({ stock: -1 });
        break;
      default:
        cursor = dbCollection.find({});
    }

    const documents = await cursor.toArray();
    console.log("All documents:", documents.length);
    console.log("All documents:", documents);
    return documents;
  } catch (err) {
    console.error("Error fetching all shoes:", err);
    throw err;
  }
}

async function insertDocument(newShoes, newImages) {
  try {
    if(newImages) {
      Array.isArray(newShoes)
      ? await dbCollection.insertMany(newShoes)
      : await dbCollection.insertOne(newShoes);

      Array.isArray(newImages)
      ? await imageShoeCollectionDB.insertMany(newImages)
      : await imageShoeCollectionDB.insertOne(newImages);
    }
    else {
      Array.isArray(newShoes)
      ? await jsonImportCollectionDB.insertMany(newShoes)
      : await jsonImportCollectionDB.insertOne(newShoes);
    }
  } catch (err) {
    console.error("Error inserting document:", err);
    throw err;
  }
}

async function findDocumentsByIdOrName({ id, name }) {
  const filters = [];
  if(id){
    filters.push({
      id: {
          $regex: id,
          $options: 'i'
      }
    });
  }
  if (name) {
    filters.push({
      name: {
        $regex: name,
        $options: 'i'
      }
    });
  }

  const mongoQuery = filters.length > 0 ? { $or: filters } : {};
  const result = await dbCollection.find(mongoQuery).toArray()
  return result
}

async function findDocument(query) {
  const filters = [];

  if(query?.size){
    const sizes = Array.isArray(query.size)
    ? query.size
    : query.size
    ? [query.size]
    : [];

    if (sizes > 0) {
      filters.push({
          size: sizes.length === 1 ? sizes[0] : { $in: sizes }
      });
      
    }
  }
  
  filters.push({
      price: {
          $gte: query.priceMin || 0,
          $lte: query.priceMax || Infinity
      }
  });

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

async function updateByID(updateList, updateImageShoes) {
  try {
    if(!Array.isArray(updateList) || !Array.isArray(updateImageShoes)) {
      await dbCollection.updateOne(
        { id: updateList.id }, 
        { $set: updateList }  
      );
      if(!updateImageShoes) return;
      await imageShoeCollectionDB.updateOne(
        { id: updateImageShoes.id }, 
        { $set: updateImageShoes }, 
        { upsert: true });
      return;
    }
    for (const updatedShoe of updateList) {
      await dbCollection.updateOne(
        { id: updatedShoe.id },
        { $set: updatedShoe }   
      );

    }
  } catch (error) {
    throw error
  }
  console.log("updateImageShoes", updateImageShoes);
  try {
    for (const updatedImageShoe of updateImageShoes) {
      const filter = { id: updatedImageShoe.id }; // Define the filter based on the unique identifier
      const update = { $set: updatedImageShoe }; // Define the update operation
  
      await imageShoeCollectionDB.updateOne(filter, update, { upsert: true });
    }
  }catch (error) {
    throw error
  }
}

async function findImageByImageName(name) {
  const shoeImage = await imageShoeCollectionDB.findOne({ 'image.name': name });
    const image = shoeImage ? shoeImage.image : null;
    return image
}

async function updateManyBySearchResult(priceMinus, brand, lessStock) {
  try{
    await dbCollection.updateMany(
      { stock: { $lt: parseInt(lessStock) }, brand: { $regex: brand, $options: 'i' } },  // Compound filter
      { $inc: { price: -parseInt(priceMinus) } }         // Decrease price by 1,000,000
    );
  } catch (error) {
    throw error;
  }
}

async function getHighestID() {
  try {
    const result = await dbCollection.aggregate([
      {
        $addFields: {
          numericId: {
            $toInt: {
              $substrCP: [
                "$id",
                { $subtract: [ { $strLenCP: "$id" }, 3 ] },
                3
              ]
            }
          }
        }
      },
      { $sort: { numericId: -1 } },
      { $limit: 1 }
    ]).toArray();

    if (result.length > 0) {
      return result[0].numericId;
    } else {
      return null; 
    }
  } catch (error) {
    throw error;
  }
}
async function deleteShoeByID(id){
  try {
    const result = await dbCollection.deleteOne({ id: id });
    
    if (result.deletedCount === 0) {
      console.log("No document found with the given ID.");
    } else {
      console.log("Document deleted successfully.");
    }
  }catch (error) {
    throw error;
  }
}

module.exports = {
  connectToMongoDB,
  closeMongoDBConnection,
  insertDocument,
  findDocumentsByIdOrName,
    findDocument,
    updateByID,
    updateManyBySearchResult,
    findImageByImageName,
    getHighestID,
    findAllDocuments,
    deleteShoeByID
};
