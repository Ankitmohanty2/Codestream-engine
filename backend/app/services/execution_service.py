import asyncio
import logging
import subprocess
import tempfile
import os
import shutil
from typing import Optional, Tuple
from datetime import datetime
import uuid

from app.models.schemas import Language
from app.config import settings

logger = logging.getLogger(__name__)


class ExecutionService:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp(prefix="codestream_")
        logger.info(f"Created execution temp directory: {self.temp_dir}")

    async def execute(
        self,
        code: str,
        language: Language,
        input_data: str = ""
    ) -> Tuple[str, Optional[str], float]:
        start_time = datetime.utcnow()

        try:
            if language == Language.PYTHON:
                result = await self._execute_python(code, input_data)
            elif language == Language.CPP:
                result = await self._execute_cpp(code, input_data)
            else:
                result = ("", f"Unsupported language: {language}", 0.0)

            execution_time = (datetime.utcnow() - start_time).total_seconds()

            return (*result, execution_time)

        except Exception as e:
            logger.error(f"Execution error: {e}")
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            return ("", str(e), execution_time)

    async def _execute_python(
        self,
        code: str,
        input_data: str
    ) -> Tuple[str, Optional[str]]:
        execution_id = str(uuid.uuid4())[:8]
        filename = f"temp_{execution_id}.py"
        filepath = os.path.join(self.temp_dir, filename)

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(code)

            process = await asyncio.create_subprocess_exec(
                "python",
                filepath,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.temp_dir
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=input_data.encode() if input_data else None),
                timeout=settings.code_execution_timeout
            )

            output = stdout.decode("utf-8", errors="replace")
            error = stderr.decode("utf-8", errors="replace")

            return output, error if error else None

        except asyncio.TimeoutError:
            process.kill()
            return ("", "Execution timed out (30s limit)")

        except Exception as e:
            return ("", str(e))

        finally:
            if os.path.exists(filepath):
                os.remove(filepath)

    async def _execute_cpp(
        self,
        code: str,
        input_data: str
    ) -> Tuple[str, Optional[str]]:
        execution_id = str(uuid.uuid4())[:8]
        source_file = f"temp_{execution_id}.cpp"
        exe_file = f"temp_{execution_id}.exe"

        source_path = os.path.join(self.temp_dir, source_file)
        exe_path = os.path.join(self.temp_dir, exe_file)

        try:
            with open(source_path, "w", encoding="utf-8") as f:
                f.write(code)

            compile_process = await asyncio.create_subprocess_exec(
                "g++",
                "-o", exe_path,
                source_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            _, compile_stderr = await compile_process.communicate()

            if compile_process.returncode != 0:
                error = compile_stderr.decode("utf-8", errors="replace")
                return ("", f"Compilation error:\n{error}")

            process = await asyncio.create_subprocess_exec(
                exe_path,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.temp_dir
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=input_data.encode() if input_data else None),
                timeout=settings.code_execution_timeout
            )

            output = stdout.decode("utf-8", errors="replace")
            error = stderr.decode("utf-8", errors="replace")

            return output, error if error else None

        except asyncio.TimeoutError:
            process.kill()
            return ("", "Execution timed out (30s limit)")

        except FileNotFoundError:
            return ("", "g++ compiler not found. Please install MinGW or GCC.")

        except Exception as e:
            return ("", str(e))

        finally:
            for path in [source_path, exe_path]:
                if os.path.exists(path):
                    os.remove(path)

    def cleanup(self) -> None:
        try:
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
            logger.info("Cleaned up execution temp directory")
        except Exception as e:
            logger.error(f"Failed to cleanup temp directory: {e}")


execution_service = ExecutionService()
