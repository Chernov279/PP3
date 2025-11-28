from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from .repository import ProfileRepository
from .service import ProfileService
from ..schemas.users import ProfileCreate, ProfileResponse

router = APIRouter()

def get_profile_repository(db: Session = Depends(get_db)) -> ProfileRepository:
    return ProfileRepository(db)

def get_profile_service(profile_repo: ProfileRepository = Depends(get_profile_repository)) -> ProfileService:
    return ProfileService(profile_repo)

@router.get("/{user_id}/profile", response_model=ProfileResponse)
async def get_profile(
    user_id: int,
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        return profile_service.get_user_profile(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{user_id}/profile", response_model=ProfileResponse)
async def create_profile(
    user_id: int,
    profile_data: ProfileCreate,
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        profile_data.user_id = user_id
        return profile_service.create_profile(profile_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )