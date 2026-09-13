import json

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from backend.src.config import settings

class S3StorageService:
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            region_name="us-east-1"
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket_name)

        # Публичное чтение всех объектов
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"],
                }
            ],
        }
        self.client.put_bucket_policy(
            Bucket=self.bucket_name,
            Policy=json.dumps(policy),
        )

    async def upload_avatar(self, user_id: int, file: UploadFile) -> str:
        # Проверка типа
        allowed = ["image/jpeg", "image/jpg", "image/png"]
        if file.content_type not in allowed:
            raise HTTPException(400, "Only JPEG/PNG allowed")
        
        # Читаем содержимое для проверки размера
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(400, "File size > 5MB")
        await file.seek(0)  # сброс указателя
        
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png']:
            ext = 'jpg'
        object_key = f"avatars/{user_id}/{user_id}.{ext}"
        
        self.client.upload_fileobj(file.file, self.bucket_name, object_key)
        return f"{settings.MINIO_PUBLIC_URL}/{self.bucket_name}/{object_key}"

    def delete_avatar(self, object_key: str):
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
        except ClientError:
            pass