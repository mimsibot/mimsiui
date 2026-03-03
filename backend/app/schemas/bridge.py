from pydantic import BaseModel, Field


class CreateTaskRequest(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    goal: str = Field(min_length=5, max_length=6000)


class BridgeRequestResponse(BaseModel):
    request_id: int
    status: str
    task_id: int | None = None

