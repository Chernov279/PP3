import pytest
from pydantic import ValidationError

from backend.src.api.auth.schemas import AuthRegisterIn


class TestPasswordValidation:
    """Тесты валидации сложности пароля"""

    def test_valid_password(self):
        """Пароль проходит все проверки"""
        data = {
            "email": "test@example.com",
            "password": "StrongPass1!",
            "name": "Test User"
        }
        user = AuthRegisterIn(**data)
        assert user.password == "StrongPass1!"

    def test_password_too_short(self):
        """Пароль короче 8 символов"""
        data = {
            "email": "test@example.com",
            "password": "Short1!",
            "name": "Test User"
        }
        with pytest.raises(ValidationError) as exc_info:
            AuthRegisterIn(**data)
        assert "минимум 8 символов" in str(exc_info.value)

    def test_password_no_digit(self):
        """Пароль без цифры"""
        data = {
            "email": "test@example.com",
            "password": "NoDigitPass!",
            "name": "Test User"
        }
        with pytest.raises(ValidationError) as exc_info:
            AuthRegisterIn(**data)
        assert "хотя бы одну цифру" in str(exc_info.value)

    def test_password_no_special_char(self):
        """Пароль без специального символа"""
        data = {
            "email": "test@example.com",
            "password": "NoSpecialChar1",
            "name": "Test User"
        }
        with pytest.raises(ValidationError) as exc_info:
            AuthRegisterIn(**data)
        assert "специальный символ" in str(exc_info.value)

    def test_password_no_uppercase(self):
        """Пароль без заглавной буквы"""
        data = {
            "email": "test@example.com",
            "password": "nouppercase1!",
            "name": "Test User"
        }
        with pytest.raises(ValidationError) as exc_info:
            AuthRegisterIn(**data)
        assert "заглавную букву" in str(exc_info.value)

    def test_password_multiple_errors(self):
        """Пароль не проходит несколько проверок одновременно"""
        data = {
            "email": "test@example.com",
            "password": "weak",
            "name": "Test User"
        }
        with pytest.raises(ValidationError) as exc_info:
            AuthRegisterIn(**data)
        errors = str(exc_info.value)
        assert "минимум 8 символов" in errors
        assert "цифру" in errors
        assert "специальный символ" in errors
        