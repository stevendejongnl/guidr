import pytest
from httpx import AsyncClient


class TestRegisterEndpoint:
    """Test POST /register endpoint"""

    @pytest.mark.asyncio
    async def test_register_success(self, test_client: AsyncClient):
        """Should register new user and return token"""
        response = await test_client.post(
            "/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert "token" in data
        assert "email" in data
        assert "id" in data
        assert data["email"] == "newuser@example.com"
        assert len(data["token"]) > 0
        assert len(data["id"]) > 0

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, test_client: AsyncClient):
        """Should reject duplicate email registration"""
        # Register first user
        await test_client.post(
            "/register",
            json={
                "email": "duplicate@example.com",
                "password": "password123"
            }
        )

        # Try to register with same email
        response = await test_client.post(
            "/register",
            json={
                "email": "duplicate@example.com",
                "password": "differentpassword"
            }
        )

        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert "already registered" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_duplicate_email_case_insensitive(self, test_client: AsyncClient):
        """Should reject duplicate email regardless of case"""
        # Register with lowercase
        await test_client.post(
            "/register",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )

        # Try to register with uppercase
        response = await test_client.post(
            "/register",
            json={
                "email": "TEST@EXAMPLE.COM",
                "password": "password123"
            }
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, test_client: AsyncClient):
        """Should reject invalid email format"""
        response = await test_client.post(
            "/register",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_register_missing_password(self, test_client: AsyncClient):
        """Should reject request without password"""
        response = await test_client.post(
            "/register",
            json={
                "email": "test@example.com"
            }
        )

        assert response.status_code == 422  # Validation error


class TestLoginEndpoint:
    """Test POST /login endpoint"""

    @pytest.mark.asyncio
    async def test_login_registered_user_success(self, test_client: AsyncClient):
        """Should login registered user with correct credentials"""
        # Register user first
        register_response = await test_client.post(
            "/register",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        assert register_response.status_code == 201

        # Login with same credentials
        login_response = await test_client.post(
            "/login",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )

        assert login_response.status_code == 200
        data = login_response.json()
        assert "token" in data
        assert "email" in data
        assert data["email"] == "login@example.com"
        assert len(data["token"]) > 0

    @pytest.mark.asyncio
    async def test_login_test_credentials_success(self, test_client: AsyncClient):
        """Should login with test credentials"""
        response = await test_client.post(
            "/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_login_admin_test_credentials_success(self, test_client: AsyncClient):
        """Should login with admin test credentials"""
        response = await test_client.post(
            "/login",
            json={
                "email": "admin@guidr.com",
                "password": "admin123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "admin@guidr.com"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, test_client: AsyncClient):
        """Should reject login with wrong password"""
        # Register user
        await test_client.post(
            "/register",
            json={
                "email": "user@example.com",
                "password": "correctpassword"
            }
        )

        # Try to login with wrong password
        response = await test_client.post(
            "/login",
            json={
                "email": "user@example.com",
                "password": "wrongpassword"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, test_client: AsyncClient):
        """Should reject login for nonexistent user"""
        response = await test_client.post(
            "/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_login_invalid_email_format(self, test_client: AsyncClient):
        """Should reject invalid email format"""
        response = await test_client.post(
            "/login",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_login_case_insensitive_email(self, test_client: AsyncClient):
        """Should login with case-insensitive email"""
        # Register with lowercase
        await test_client.post(
            "/register",
            json={
                "email": "case@example.com",
                "password": "password123"
            }
        )

        # Login with uppercase
        response = await test_client.post(
            "/login",
            json={
                "email": "CASE@EXAMPLE.COM",
                "password": "password123"
            }
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_login_password_hash_verification(self, test_client: AsyncClient):
        """Should properly verify Argon2 password hash"""
        # Register user
        await test_client.post(
            "/register",
            json={
                "email": "hash@example.com",
                "password": "MySecurePassword123!"
            }
        )

        # Verify correct password works
        correct_response = await test_client.post(
            "/login",
            json={
                "email": "hash@example.com",
                "password": "MySecurePassword123!"
            }
        )
        assert correct_response.status_code == 200

        # Verify incorrect password fails
        incorrect_response = await test_client.post(
            "/login",
            json={
                "email": "hash@example.com",
                "password": "WrongPassword"
            }
        )
        assert incorrect_response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_jwt_token_structure(self, test_client: AsyncClient):
        """Should return valid JWT token structure"""
        response = await test_client.post(
            "/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        token = data["token"]

        # JWT tokens have 3 parts separated by dots
        assert token.count(".") == 2
        parts = token.split(".")
        assert all(len(part) > 0 for part in parts)
