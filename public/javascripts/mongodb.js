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



async function findDocumentsByName(name) {
  try {
    console.log("Finding documents by name:", name);
    return await dbCollection.find({ name: { $regex: name, $options: 'i' } }).toArray();
  } catch (err) {
    console.error("Error finding document by name:", err);
    throw err;
  }
}

async function findDocumentById(query) {
  try {
    return await dbCollection.findOne(query);
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

async function updateShoeById(editShoe) {
  try {
    const result = await dbCollection.updateOne(
      { id: editShoe.id }, 
      { $set: editShoe }
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
    console.log("Search results:", documents.length);
    return documents;
}

async function updateManyByID(updateList, updateImageShoes) {
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
        { id: updatedShoe.id }, // Filter to match the document
        { $set: updatedShoe }   // Update operation
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

async function findImageByShoeID(id) {
    const shoeImage = await imageShoeCollectionDB.findOne({ id: id });
    const image = shoeImage ? shoeImage.image : null;
    return image
    
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
    // console.log(priceMinus, brand, lessStock);
    // const matchingDocs = await dbCollection.find({
    //   stock: { $lt: parseInt(lessStock) },
    //   brand: { $regex: brand, $options: 'i' }
    // }).toArray();
    
    // console.log(matchingDocs);
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
      return null; // No documents found
    }
  } catch (error) {
    throw error;
  }
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
    updateManyByID,
    updateManyBySearchResult,
    findImageByShoeID,
    findImageByImageName,
    getHighestID,
    findAllDocuments
};
