const { CosmosClient } = require("@azure/cosmos");

class DB {
  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY,
    });

    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Create the database if it doesn't exist
      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: process.env.COSMOS_DB,
      });

      const databaseId = database.id;

      // Create containers if they don't exist
      await this.createContainer(
        databaseId,
        process.env.COSMOS_CONTAINER_USER_DETAILS
      );
      await this.createContainer(
        databaseId,
        process.env.COSMOS_CONTAINER_LEARNING_VIDEOS
      );
    } catch (error) {
      console.error("Failed to initialize database:", error);
      // Handle or log the error as needed
    }
  }

  async createContainer(databaseId, containerId) {
    try {
      await this.cosmosClient
        .database(databaseId)
        .containers.createIfNotExists({
          id: containerId,
        });
    } catch (error) {
      console.error(`Failed to create container ${containerId}:`, error);
      // Handle or log the error as needed
    }
  }

  getUserDetailsContainer() {
    const database = this.cosmosClient.database(process.env.COSMOS_DB);
    return database.container(process.env.COSMOS_CONTAINER_USER_DETAILS);
  }

  getLearningVideosContainer() {
    const database = this.cosmosClient.database(process.env.COSMOS_DB);
    return database.container(process.env.COSMOS_CONTAINER_LEARNING_VIDEOS);
  }
}

module.exports = new DB();
