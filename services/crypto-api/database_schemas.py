"""
Pydantic schemas for database operations.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    role: Optional[str] = Field(None, max_length=255)
    sector: Optional[str] = Field(None, max_length=255)

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    created_at: date
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

# Base schema for EHR records
class EHRRecordBase(BaseModel):
    ciphertext: Optional[str] = None
    storage_path: Optional[str] = None

class EHRRecordCreate(EHRRecordBase):
    created_by: UUID

class EHRRecordResponse(EHRRecordBase):
    id: UUID
    created_by: Optional[UUID]
    created_date: date
    updated_date: Optional[date]
    is_deleted: bool
    
    model_config = ConfigDict(from_attributes=True)

# Patient schemas
class PatientCreate(EHRRecordCreate):
    pass

class PatientResponse(EHRRecordResponse):
    pass

class PatientUpdate(BaseModel):
    ciphertext: Optional[str] = None
    storage_path: Optional[str] = None
    updated_date: Optional[date] = None

# Condition schemas
class ConditionCreate(EHRRecordCreate):
    patient_id: UUID

class ConditionResponse(EHRRecordResponse):
    patient_id: UUID

class ConditionUpdate(BaseModel):
    ciphertext: Optional[str] = None
    storage_path: Optional[str] = None
    updated_date: Optional[date] = None

# Encounter schemas
class EncounterCreate(EHRRecordCreate):
    patient_id: UUID

class EncounterResponse(EHRRecordResponse):
    patient_id: UUID

class EncounterUpdate(BaseModel):
    ciphertext: Optional[str] = None
    storage_path: Optional[str] = None
    updated_date: Optional[date] = None

# Account schemas
class AccountCreate(EHRRecordCreate):
    patient_id: UUID

class AccountResponse(EHRRecordResponse):
    patient_id: UUID

class AccountUpdate(BaseModel):
    ciphertext: Optional[str] = None
    storage_path: Optional[str] = None
    updated_date: Optional[date] = None
