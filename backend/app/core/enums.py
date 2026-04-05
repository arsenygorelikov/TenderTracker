from enum import Enum


class UserRole(str, Enum):
    ORG_ADMIN = "ORG_ADMIN"
    TENDER_MANAGER = "TENDER_MANAGER"
    VIEWER = "VIEWER"


class TenderType(str, Enum):
    FEDERAL_44 = "44-ФЗ"
    FEDERAL_223 = "223-ФЗ"
    COMMERCIAL = "Коммерческая"


class TenderStatus(str, Enum):
    DRAFT = "draft"
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
