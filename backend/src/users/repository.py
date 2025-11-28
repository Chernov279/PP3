from sqlalchemy.orm import Session
from ..models.models import Profile
from ..schemas.users import ProfileCreate


class ProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_profile_by_user_id(self, user_id: int) -> Profile:
        return self.db.query(Profile).filter(Profile.user_id == user_id).first()

    def create_profile(self, profile_data: ProfileCreate) -> Profile:
        db_profile = Profile(**profile_data.dict())
        self.db.add(db_profile)
        self.db.commit()
        self.db.refresh(db_profile)
        return db_profile

    def update_profile(self, user_id: int, profile_data: ProfileCreate) -> Profile:
        profile = self.get_profile_by_user_id(user_id)
        if not profile:
            return None

        for key, value in profile_data.dict().items():
            setattr(profile, key, value)

        self.db.commit()
        self.db.refresh(profile)
        return profile