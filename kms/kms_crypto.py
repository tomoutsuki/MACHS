"""Low-level cryptographic helpers for the simulated KMS."""

from __future__ import annotations

import os
from typing import Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_aes256_key() -> bytes:
    """Return a freshly generated 256-bit AES key."""
    return os.urandom(32)


def encrypt_aes_gcm(plaintext: bytes, key: bytes) -> Tuple[bytes, bytes, bytes]:
    """Encrypt *plaintext* with AES-256-GCM using *key*.

    Args:
        plaintext: The raw bytes to encrypt.
        key: A 32-byte AES-GCM key.

    Returns:
        A tuple of ``(ciphertext, nonce, tag)``.
    """
    if len(key) != 32:
        raise ValueError("AES-256 key must be exactly 32 bytes long")
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    # AESGCM encrypt returns ciphertext+tag; split to keep interface clear
    tag = ciphertext[-16:]
    payload = ciphertext[:-16]
    return payload, nonce, tag


def decrypt_aes_gcm(ciphertext: bytes, key: bytes, nonce: bytes, tag: bytes) -> bytes:
    """Decrypt *ciphertext* with AES-256-GCM.

    Args:
        ciphertext: The encrypted payload without the tag.
        key: A 32-byte AES-GCM key.
        nonce: The 96-bit initialization vector used for encryption.
        tag: The 128-bit authentication tag.

    Returns:
        The decrypted plaintext bytes.
    """
    if len(key) != 32:
        raise ValueError("AES-256 key must be exactly 32 bytes long")
    if len(tag) != 16:
        raise ValueError("GCM tag must be 16 bytes long")
    aesgcm = AESGCM(key)
    combined = ciphertext + tag
    return aesgcm.decrypt(nonce, combined, None)
