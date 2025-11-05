"""
Database API endpoints for EHR data management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import date

from database import get_db
from database_models import User, Patient, Condition, Encounter, Account
from database_schemas import (
    UserCreate, UserResponse,
    PatientCreate, PatientResponse, PatientUpdate,
    ConditionCreate, ConditionResponse, ConditionUpdate,
    EncounterCreate, EncounterResponse, EncounterUpdate,
    AccountCreate, AccountResponse, AccountUpdate
)

router = APIRouter(prefix="/db", tags=["Database Operations"])

# User endpoints
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user."""
    user = User(**user_data.model_dump())
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """List all users."""
    query = select(User)
    if active_only:
        query = query.where(User.is_active == True)
    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Patient endpoints
@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(patient_data: PatientCreate, db: AsyncSession = Depends(get_db)):
    """Create a new patient record."""
    # Validate storage constraint
    if (patient_data.ciphertext and patient_data.storage_path) or \
       (not patient_data.ciphertext and not patient_data.storage_path):
        raise HTTPException(
            status_code=400,
            detail="Must provide either ciphertext OR storage_path, not both or neither"
        )
    
    patient = Patient(**patient_data.model_dump())
    db.add(patient)
    await db.flush()
    await db.refresh(patient)
    return patient

@router.get("/patients", response_model=List[PatientResponse])
async def list_patients(
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List all patient records."""
    query = select(Patient)
    if not include_deleted:
        query = query.where(Patient.is_deleted == False)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    patients = result.scalars().all()
    return patients

@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific patient record."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    patient_update: PatientUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a patient record."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_date'] = date.today()
        for key, value in update_data.items():
            setattr(patient, key, value)
        await db.flush()
        await db.refresh(patient)
    
    return patient

@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_patient(patient_id: UUID, db: AsyncSession = Depends(get_db)):
    """Soft delete a patient record."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.is_deleted = True
    patient.updated_date = date.today()
    await db.flush()

# Condition endpoints
@router.post("/conditions", response_model=ConditionResponse, status_code=status.HTTP_201_CREATED)
async def create_condition(condition_data: ConditionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new condition record."""
    if (condition_data.ciphertext and condition_data.storage_path) or \
       (not condition_data.ciphertext and not condition_data.storage_path):
        raise HTTPException(
            status_code=400,
            detail="Must provide either ciphertext OR storage_path, not both or neither"
        )
    
    condition = Condition(**condition_data.model_dump())
    db.add(condition)
    await db.flush()
    await db.refresh(condition)
    return condition

@router.get("/conditions", response_model=List[ConditionResponse])
async def list_conditions(
    patient_id: UUID = None,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List condition records."""
    query = select(Condition)
    if patient_id:
        query = query.where(Condition.patient_id == patient_id)
    if not include_deleted:
        query = query.where(Condition.is_deleted == False)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    conditions = result.scalars().all()
    return conditions

@router.get("/conditions/{condition_id}", response_model=ConditionResponse)
async def get_condition(condition_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific condition record."""
    result = await db.execute(select(Condition).where(Condition.id == condition_id))
    condition = result.scalar_one_or_none()
    if not condition:
        raise HTTPException(status_code=404, detail="Condition not found")
    return condition

# Encounter endpoints
@router.post("/encounters", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
async def create_encounter(encounter_data: EncounterCreate, db: AsyncSession = Depends(get_db)):
    """Create a new encounter record."""
    if (encounter_data.ciphertext and encounter_data.storage_path) or \
       (not encounter_data.ciphertext and not encounter_data.storage_path):
        raise HTTPException(
            status_code=400,
            detail="Must provide either ciphertext OR storage_path, not both or neither"
        )
    
    encounter = Encounter(**encounter_data.model_dump())
    db.add(encounter)
    await db.flush()
    await db.refresh(encounter)
    return encounter

@router.get("/encounters", response_model=List[EncounterResponse])
async def list_encounters(
    patient_id: UUID = None,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List encounter records."""
    query = select(Encounter)
    if patient_id:
        query = query.where(Encounter.patient_id == patient_id)
    if not include_deleted:
        query = query.where(Encounter.is_deleted == False)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    encounters = result.scalars().all()
    return encounters

@router.get("/encounters/{encounter_id}", response_model=EncounterResponse)
async def get_encounter(encounter_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific encounter record."""
    result = await db.execute(select(Encounter).where(Encounter.id == encounter_id))
    encounter = result.scalar_one_or_none()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter

# Account endpoints
@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(account_data: AccountCreate, db: AsyncSession = Depends(get_db)):
    """Create a new account record."""
    if (account_data.ciphertext and account_data.storage_path) or \
       (not account_data.ciphertext and not account_data.storage_path):
        raise HTTPException(
            status_code=400,
            detail="Must provide either ciphertext OR storage_path, not both or neither"
        )
    
    account = Account(**account_data.model_dump())
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account

@router.get("/accounts", response_model=List[AccountResponse])
async def list_accounts(
    patient_id: UUID = None,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List account records."""
    query = select(Account)
    if patient_id:
        query = query.where(Account.patient_id == patient_id)
    if not include_deleted:
        query = query.where(Account.is_deleted == False)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    accounts = result.scalars().all()
    return accounts

@router.get("/accounts/{account_id}", response_model=AccountResponse)
async def get_account(account_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific account record."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account
