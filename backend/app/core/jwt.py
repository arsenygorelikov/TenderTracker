from datetime import datetime, timedelta
from typing import Any
from jose import jwt, JWTError
from app.config import get_settings

settings = get_settings()


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def decode_access_token(token: str) -> int:
    """
    Декодирует access токен и возвращает user_id.
    Raises JWTError если токен невалиден или истёк.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        user_id = payload.get("sub")
        if user_id is None:
            raise JWTError("Missing subject in token")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise JWTError("Token has expired")
    except jwt.JWTError as e:
        raise JWTError(f"Invalid token: {str(e)}")


def decode_refresh_token(token: str) -> int:
    """
    Декодирует refresh токен и возвращает user_id.
    Raises JWTError если токен невалиден или истёк.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")
        user_id = payload.get("sub")
        if user_id is None:
            raise JWTError("Missing subject in token")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise JWTError("Token has expired")
    except jwt.JWTError as e:
        raise JWTError(f"Invalid token: {str(e)}")
