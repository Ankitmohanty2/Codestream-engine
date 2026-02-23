import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.schemas import (
    CodeExecutionRequest,
    CodeExecutionResponse
)
from app.services.execution_service import ExecutionService, execution_service
from app.dependencies import get_execution_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/run", tags=["execution"])


@router.post("", response_model=CodeExecutionResponse)
async def run_code(
    request: CodeExecutionRequest,
    exec_service: ExecutionService = Depends(get_execution_service)
) -> CodeExecutionResponse:
    logger.info(f"Executing {request.language} code")

    output, error, execution_time = await exec_service.execute(
        code=request.code,
        language=request.language,
        input_data=request.input or ""
    )

    return CodeExecutionResponse(
        output=output,
        error=error,
        execution_time=execution_time
    )
