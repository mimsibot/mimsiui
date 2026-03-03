from pydantic import BaseModel, Field


class CreateChatSessionRequest(BaseModel):
    title: str = Field(default="", max_length=120)


class CreateChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=6000)


class ChatSessionResponse(BaseModel):
    session_id: int
    status: str

