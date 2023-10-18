const { CosmosClient } = require("@azure/cosmos");

// Initialize Azure Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY,
});

module.exports = cosmosClient;
