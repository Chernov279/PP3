from pydantic import BaseModel


class ProfileBase(BaseModel):
    bio: str = None
    avatar_url: str = None


class ProfileCreate(ProfileBase):
    user_id: int


class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True