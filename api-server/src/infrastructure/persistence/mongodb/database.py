"""MongoDB database connection management."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from ...config.settings import Settings
from .indexes import create_indexes


class Database:
    """MongoDB database connection manager."""

    def __init__(self, settings: Settings):
        """Initialize database connection.

        Args:
            settings: Application settings containing MongoDB configuration
        """
        self._settings = settings
        self._client: AsyncIOMotorClient | None = None
        self._database: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        """Connect to MongoDB."""
        self._client = AsyncIOMotorClient(
            self._settings.mongodb_url,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=30000,
            retryWrites=True,
            retryReads=True,
        )
        self._database = self._client[self._settings.mongodb_database]

        # Create indexes
        await create_indexes(self._database)

    async def disconnect(self) -> None:
        """Disconnect from MongoDB."""
        if self._client:
            self._client.close()
            self._client = None
            self._database = None

    @property
    def client(self) -> AsyncIOMotorClient:
        """Get MongoDB client.

        Returns:
            MongoDB async client

        Raises:
            RuntimeError: If not connected
        """
        if self._client is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._client

    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get MongoDB database.

        Returns:
            MongoDB async database

        Raises:
            RuntimeError: If not connected
        """
        if self._database is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._database
