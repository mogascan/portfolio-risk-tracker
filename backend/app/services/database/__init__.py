"""
Database services module
"""
from app.core.settings import USE_DATABASE

if USE_DATABASE:
    from app.services.database.db_service import DatabaseService
else:
    from app.services.database.mock_database import MockDatabaseService as DatabaseService

__all__ = ["DatabaseService"] 