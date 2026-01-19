from backend.src.auth.schemas import UserBaseSchema

class UserUpdateIn(UserBaseSchema):
    name : str
    email : str


class UserOut(UserBaseSchema):
    id: int
    email: str
    name: str

    class Config:
        from_attributes = True