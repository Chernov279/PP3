from .repository import ProfileRepository
from ..schemas.users import ProfileCreate, ProfileResponse


class ProfileService:
    def __init__(self, profile_repository: ProfileRepository):
        self.profile_repository = profile_repository

    def get_user_profile(self, user_id: int) -> ProfileResponse:
        profile = self.profile_repository.get_profile_by_user_id(user_id)
        if not profile:
            raise ValueError("Profile not found")
        return ProfileResponse.from_orm(profile)

    def create_profile(self, profile_data: ProfileCreate) -> ProfileResponse:
        existing_profile = self.profile_repository.get_profile_by_user_id(profile_data.user_id)
        if existing_profile:
            raise ValueError("Profile already exists")

        profile = self.profile_repository.create_profile(profile_data)
        return ProfileResponse.from_orm(profile)

    def update_profile(self, user_id: int, profile_data: ProfileCreate) -> ProfileResponse:
        profile = self.profile_repository.update_profile(user_id, profile_data)
        if not profile:
            raise ValueError("Profile not found")
        return ProfileResponse.from_orm(profile)