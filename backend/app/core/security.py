import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import get_settings


def _get_fernet() -> Fernet:
    """Returns Fernet instance using secret key."""
    settings = get_settings()
    key = hashlib.sha256(settings.secret_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_token(token: str) -> str:
    """Encrypts a token string."""
    if not token:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    """Decrypts an encrypted token string."""
    if not encrypted:
        return ""
    fernet = _get_fernet()
    return fernet.decrypt(encrypted.encode()).decode()
