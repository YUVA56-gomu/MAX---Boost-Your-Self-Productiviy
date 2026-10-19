import json
import hashlib
import time
import uuid
import os
import sys
import shutil
import subprocess
import asyncio
from typing import Dict, Any, Optional, Tuple, List
import httpx
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.ai_audit import AIAuditLog
from backend.app.schemas.ai import ProposedChange


class OllamaClient:
    """Communicates directly with local Ollama daemon for offline intelligence."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.model = model or settings.ollama_model
        self.timeout_seconds = timeout_seconds or getattr(settings, "ai_generate_timeout_seconds", 45.0)

    @staticmethod
    def find_ollama_binary() -> Optional[str]:
        """Locate Ollama executable on the workstation using allowlisted paths."""
        in_path = shutil.which("ollama")
        if in_path and os.path.exists(in_path):
            return in_path

        local_app_data = os.environ.get("LOCALAPPDATA", "")
        prog_files = os.environ.get("ProgramFiles", "C:\\Program Files")
        prog_files_x86 = os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")
        candidates = [
            os.path.join(local_app_data, "Programs", "Ollama", "ollama.exe"),
            os.path.join(prog_files, "Ollama", "ollama.exe"),
            os.path.join(prog_files_x86, "Ollama", "ollama.exe"),
            "/usr/local/bin/ollama",
            "/usr/bin/ollama",
            "/opt/homebrew/bin/ollama",
        ]
        for path in candidates:
            if path and os.path.exists(path) and os.path.isfile(path):
                return path
        return None

    async def check_detailed_status(self) -> Dict[str, Any]:
        """Verify Ollama binary presence, daemon service responsiveness, and model availability."""
        binary_path = self.find_ollama_binary()
        ollama_installed = binary_path is not None

        try:
            async with httpx.AsyncClient(timeout=settings.ai_probe_timeout_seconds) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models_raw = data.get("models", [])
                    model_names = [m.get("name", "") for m in models_raw]

                    # Match configured model
                    target_model = self.model
                    matched_info = next((m for m in models_raw if target_model in m.get("name", "")), None)
                    model_available = matched_info is not None

                    model_size_bytes = matched_info.get("size") if matched_info else None
                    model_size_mb = round(model_size_bytes / (1024 * 1024)) if model_size_bytes else None

                    state = "model_ready" if model_available else "model_missing"

                    return {
                        "enabled": settings.ai_enabled,
                        "available": model_available,
                        "state": state,
                        "ollama_installed": True,
                        "service_running": True,
                        "configured_model": self.model,
                        "model_available": model_available,
                        "active_model": matched_info.get("name") if matched_info else (model_names[0] if model_names else None),
                        "base_url": self.base_url,
                        "installed_models": model_names,
                        "model_size_bytes": model_size_bytes,
                        "model_size_mb": model_size_mb,
                        "binary_path": binary_path,
                    }
        except Exception:
            pass

        state = "ollama_stopped" if ollama_installed else "ollama_not_installed"
        return {
            "enabled": settings.ai_enabled,
            "available": False,
            "state": state,
            "ollama_installed": ollama_installed,
            "service_running": False,
            "configured_model": self.model,
            "model_available": False,
            "active_model": None,
            "base_url": self.base_url,
            "installed_models": [],
            "model_size_bytes": None,
            "model_size_mb": None,
            "binary_path": binary_path,
        }

    async def start_service(self) -> Tuple[bool, str, bool]:
        """Safely start local Ollama background service using strictly allowlisted binary."""
        status = await self.check_detailed_status()
        if status["service_running"]:
            return True, "Ollama service is already running on port 11434.", True

        binary_path = self.find_ollama_binary()
        if not binary_path:
            return False, "Ollama executable not found on host machine. Please install Ollama first.", False

        try:
            creationflags = 0
            if sys.platform == "win32":
                creationflags = 0x08000000  # CREATE_NO_WINDOW

            subprocess.Popen(
                [binary_path, "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creationflags,
            )

            for _ in range(8):
                await asyncio.sleep(0.5)
                check = await self.check_detailed_status()
                if check["service_running"]:
                    return True, "Ollama background service launched successfully.", True

            return False, "Ollama process launched but service port 11434 is not responding yet. Please check again or run 'ollama serve' in terminal.", False
        except Exception as e:
            return False, f"Could not launch Ollama daemon: {e}", False

    async def pull_model(self, model_name: Optional[str] = None) -> Tuple[bool, str]:
        """Trigger pull for configured open-weight model."""
        target_model = model_name or self.model
        allowed = [settings.ollama_model, "gemma2:2b", "gemma2"]
        if target_model not in allowed:
            return False, f"Model '{target_model}' is not in the allowed models list: {allowed}"

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": target_model, "stream": False},
                )
                if resp.status_code == 200:
                    check = await self.check_detailed_status()
                    if check["model_available"]:
                        return True, f"Model '{target_model}' successfully downloaded and verified."
                    return True, f"Model download request completed with status: {resp.text}"
                return False, f"Ollama returned HTTP {resp.status_code}: {resp.text}"
        except httpx.TimeoutException:
            return False, "Model download timed out. Downloading large models may require more time or an active connection."
        except Exception as e:
            return False, f"Failed to pull model: {e}"

    async def test_inference(self) -> Tuple[bool, int, str, Optional[str]]:
        """Bounded test inference validating end-to-end model execution."""
        start_time = time.perf_counter()
        try:
            payload = {
                "model": self.model,
                "prompt": "Respond with OK",
                "stream": False,
                "options": {
                    "num_predict": 10,
                    "temperature": 0.1,
                },
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                elapsed_ms = int((time.perf_counter() - start_time) * 1000)
                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "").strip()
                    return True, elapsed_ms, f"Local {self.model} responded in {elapsed_ms}ms.", response_text
                return False, elapsed_ms, f"Ollama returned HTTP {resp.status_code}: {resp.text}", None
        except Exception as e:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            return False, elapsed_ms, f"Inference test failed: {e}", None

    async def check_availability(self) -> Tuple[bool, Optional[str], List[str]]:
        """Verify Ollama is running and query installed models (backward compatible)."""
        status = await self.check_detailed_status()
        return status["available"], status["active_model"], status["installed_models"]


    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Tuple[Dict[str, Any], int]:
        """Generate structured JSON response from local Gemma 2 2B."""
        start_time = time.perf_counter()
        
        full_system = (
            system_prompt
            or "You are MAX, an offline-first personal productivity coach. "
            "You diagnose productivity patterns using ONLY the real facts provided. "
            "Never invent history, numbers, or medical/psychological conditions. "
            "Respond strictly in valid JSON matching the requested schema."
        )

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": full_system,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.2,  # Low temperature for deterministic, factual adherence
                "top_p": 0.9,
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data.get("response", "{}")

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        # Parse JSON output
        try:
            parsed = json.loads(raw_text)
            if not isinstance(parsed, dict):
                parsed = {"raw": parsed}
        except Exception:
            # Fallback for minor formatting wraps
            clean = raw_text.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            parsed = json.loads(clean.strip())

        return parsed, elapsed_ms

    def log_audit_entry(
        self,
        db: Session,
        workspace_id: str,
        action_type: str,
        prompt_text: str,
        response_text: str,
        execution_time_ms: int,
    ) -> AIAuditLog:
        """Mandatory local audit logging for every AI interaction."""
        prompt_hash = hashlib.sha256(prompt_text.encode("utf-8")).hexdigest()
        audit_log = AIAuditLog(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            action_type=action_type,
            model_name=self.model,
            prompt_hash=prompt_hash,
            prompt_text=prompt_text,
            response_text=response_text,
            user_decision="pending",
            execution_time_ms=execution_time_ms,
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log
