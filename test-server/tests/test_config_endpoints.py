import pytest
from httpx import AsyncClient


class TestRootEndpoint:
    """Test GET / endpoint"""

    @pytest.mark.asyncio
    async def test_root_endpoint(self, test_client: AsyncClient):
        """Should return server info and available endpoints"""
        response = await test_client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Guidr Test Server"
        assert "version" in data
        assert data["status"] == "running"
        assert "endpoints" in data
        assert "/config" in data["endpoints"].values()
        assert "/login" in data["endpoints"].values()
        assert "/categories" in data["endpoints"].values()


class TestConfigEndpoint:
    """Test GET /config endpoint"""

    @pytest.mark.asyncio
    async def test_get_config(self, test_client: AsyncClient):
        """Should return server configuration"""
        response = await test_client.get("/config")

        assert response.status_code == 200
        data = response.json()
        assert "debugMode" in data
        assert isinstance(data["debugMode"], bool)
        assert data["debugMode"] is True  # Test server always has debug mode enabled

    @pytest.mark.asyncio
    async def test_config_has_version_fields(self, test_client: AsyncClient):
        """Should include version fields in config"""
        response = await test_client.get("/config")

        assert response.status_code == 200
        data = response.json()
        # minAppVersion and maxAppVersion are optional
        assert "minAppVersion" in data
        assert "maxAppVersion" in data
