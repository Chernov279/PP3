import os

from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
DATABASE_URL_SYNC = os.getenv('DATABASE_URL_SYNC')
SECRET_KEY = os.getenv('SECRET_KEY')

ACCESS_TOKEN_EXPIRE_MINUTES = 30
ALGORITHM = "HS256"