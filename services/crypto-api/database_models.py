"""
Database models for MACHS system using SQLAlchemy.
"""

from sqlalchemy import Column, String, Boolean, Date, DateTime, Text, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship, declarative_base
from datetime import date, datetime
import uuid

Base = declarative_base()

class User(Base):
    """User model for simulation purposes."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True)
    sector = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    patients = relationship("Patient", back_populates="creator")
    conditions = relationship("Condition", back_populates="creator")
    encounters = relationship("Encounter", back_populates="creator")
    accounts = relationship("Account", back_populates="creator")

class Patient(Base):
    """Patient EHR data (encrypted)."""
    __tablename__ = "patients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ciphertext = Column(Text, nullable=True)
    storage_path = Column(String(500), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_date = Column(Date, nullable=False, default=date.today)
    updated_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="patients")
    conditions = relationship("Condition", back_populates="patient", cascade="all, delete-orphan")
    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="patient", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            "(ciphertext IS NOT NULL AND storage_path IS NULL) OR (ciphertext IS NULL AND storage_path IS NOT NULL)",
            name="patients_storage_check"
        ),
    )

class Condition(Base):
    """Medical condition data (encrypted)."""
    __tablename__ = "conditions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    ciphertext = Column(Text, nullable=True)
    storage_path = Column(String(500), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_date = Column(Date, nullable=False, default=date.today)
    updated_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="conditions")
    creator = relationship("User", back_populates="conditions")
    
    __table_args__ = (
        CheckConstraint(
            "(ciphertext IS NOT NULL AND storage_path IS NULL) OR (ciphertext IS NULL AND storage_path IS NOT NULL)",
            name="conditions_storage_check"
        ),
    )

class Encounter(Base):
    """Medical encounter data (encrypted)."""
    __tablename__ = "encounters"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    ciphertext = Column(Text, nullable=True)
    storage_path = Column(String(500), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_date = Column(Date, nullable=False, default=date.today)
    updated_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    creator = relationship("User", back_populates="encounters")
    
    __table_args__ = (
        CheckConstraint(
            "(ciphertext IS NOT NULL AND storage_path IS NULL) OR (ciphertext IS NULL AND storage_path IS NOT NULL)",
            name="encounters_storage_check"
        ),
    )

class Account(Base):
    """Account data (encrypted)."""
    __tablename__ = "accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    ciphertext = Column(Text, nullable=True)
    storage_path = Column(String(500), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_date = Column(Date, nullable=False, default=date.today)
    updated_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="accounts")
    creator = relationship("User", back_populates="accounts")
    
    __table_args__ = (
        CheckConstraint(
            "(ciphertext IS NOT NULL AND storage_path IS NULL) OR (ciphertext IS NULL AND storage_path IS NOT NULL)",
            name="accounts_storage_check"
        ),
    )
