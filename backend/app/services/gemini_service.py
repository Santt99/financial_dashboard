
"""
Gemini AI service for processing credit card statements (Mexico).

Features:
- Robust prompt to extract statement summary (minimum payment, no-interest payment, total balance, period balance),
  transactions, and MSI (Meses sin Intereses) plans with monthly calculation.
- Enforces JSON-only responses via generation_config.
- Supports both PDFs and images. Uses upload_file when available; falls back to text extraction for PDFs.
- Backwards compatibility: maps "statement_summary" -> legacy "card_info".
- Strong parsing, validation, and normalization of amounts and dates.
"""

from __future__ import annotations

import io
import json
import re
import uuid
import tempfile
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, date

import google.generativeai as genai
from PIL import Image
import PyPDF2

from app.core.config import settings
from app.schemas.transaction import Transaction


# =========================
# Prompt (MX, genérico)
# =========================

PROMPT_MX = """
Eres un analista financiero experto en extraer datos de estados de cuenta de tarjetas de crédito en México (BBVA, Banamex/Citibanamex, Santander, HSBC, Amex, Falabella, Nu, Banorte, etc.). Debes devolver SOLO un objeto JSON válido con la estructura especificada y con alta precisión.

# Objetivo
Extrae:
- Información del estado de cuenta (resumen de pagos y saldos).
- Transacciones (detalle de movimientos).
- Planes y obligaciones de Meses Sin Intereses (MSI), con cálculo de pago mensual y meses restantes.
- Coherencia de fechas y montos (sin alucinar).

# Reglas críticas
1) Formato de salida: Devuelve únicamente un objeto JSON (sin Markdown, sin texto adicional).
2) Fuentes:
   - Para resumen: busca términos como "Saldo total", "Saldo al corte", "Saldo actual", "Saldo del periodo", "Cargos del periodo", "Pago mínimo", "Pago para no generar intereses", "Fecha límite de pago", "Fecha de corte".
   - Para MSI: busca "Meses sin intereses", "MSI", "X de N", "Plan de pagos", "Pagos diferidos", "Diferidos", "Promo".
3) Montos:
   - Convierte importes a float (MXN por defecto). Normaliza "$ 1,450.50" -> 1450.50 y "1.450,50" -> 1450.50.
   - Pagos/abonos: monto NEGATIVO en transacciones.
   - Compras/cargos: monto POSITIVO.
   - Si un campo no existe, usa null.
4) Fechas:
   - Devuelve fechas ISO (YYYY-MM-DD).
   - Si una transacción trae "12 OCT" sin año, infiere el año a partir del periodo/fecha de corte.
5) MSI Cálculo:
   - "X de N": installment_index=X, installment_total=N.
   - Si no hay monto mensual explícito, monthly_installment = round(total_purchase_amount / N, 2).
   - months_remaining = N - X (si X existe).
   - Si el mensual de MSI ya fue cubierto en el periodo, covered_this_period=true; de lo contrario false.
   - Devuelve msi_total_monthly_due (suma de mensuales pendientes del periodo).
6) Evidencia y confianza:
   - Incluye source_hint (texto corto) y confidence (0–1) para campos clave.
7) No alucines:
   - Si un dato no está presente, devuelve null y confidence=0.

# Glosario de términos
- Pago mínimo: "Pago mínimo", "Pago mínimo a cubrir".
- Pago para no generar intereses: "Pago para no generar intereses", "Pago total para no generar intereses", "Pago para evitar intereses".
- Saldo total: "Saldo total", "Saldo actual", "Saldo al corte", "Total a pagar".
- Saldo del periodo/mes: "Saldo del periodo", "Cargos del periodo", "Nuevos cargos".
- Fecha límite: "Fecha límite de pago", "Fecha de pago", "Fecha de vencimiento".
- Fecha de corte: "Fecha de corte".
- MSI: "Meses sin intereses", "X de N", "Diferidos", "Pagos diferidos", "Plan de pagos", "Promo".

# Estructura de salida (JSON)
{
  "statement_summary": {
    "issuer": "Banco/Emisor (ej. BBVA, Amex, Nu)",
    "card_name": "Nombre comercial (ej. Costco, Platinum) o null",
    "last4": "1234 o null",
    "currency": "MXN|USD|...",
    "cutoff_date": "YYYY-MM-DD",
    "period_start": "YYYY-MM-DD",
    "period_end": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "minimum_payment": 0.0,
    "minimum_payment_source_hint": "texto corto",
    "minimum_payment_confidence": 0.0,
    "no_interest_payment": 0.0,
    "no_interest_payment_source_hint": "texto corto",
    "no_interest_payment_confidence": 0.0,
    "total_balance": 0.0,
    "total_balance_source_hint": "texto corto",
    "total_balance_confidence": 0.0,
    "period_balance": 0.0,
    "period_balance_source_hint": "texto corto",
    "period_balance_confidence": 0.0,
    "credit_limit": 0.0,
    "cat": 0.0
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Descripción limpia (sin códigos internos)",
      "amount": 150.00,
      "category": "Groceries|Dining|Travel|Utilities|Shopping|Gas|Health|Payment|Other",
      "installment_plan": null,
      "raw_line": "opcional: fragmento de línea original"
    }
  ],
  "msi": {
    "msi_total_monthly_due": 0.0,
    "plans": [
      {
        "merchant": "Comercio",
        "purchase_date": "YYYY-MM-DD",
        "total_purchase_amount": 0.0,
        "installment_total": 12,
        "installment_index": 3,
        "monthly_installment": 0.0,
        "months_remaining": 9,
        "covered_this_period": true,
        "source_hint": "texto corto (ej. '03 de 12')",
        "confidence": 0.0
      }
    ]
  }
}

# Validaciones antes de devolver JSON
- Todos los montos en float.
- Fechas en formato ISO.
- Pagos en transacciones NEGATIVOS, cargos POSITIVOS.
- Si no encuentras un campo, devuelve null y confidence=0.
- No incluyas ningún texto fuera del JSON.
"""


class GeminiService:
    """Service for processing statements using Gemini AI."""

    def __init__(self):
        """Initialize Gemini service with API key."""
        self.enabled = False
        self.model = None
        if getattr(settings, "gemini_api_key", None):
            genai.configure(api_key=settings.gemini_api_key)
            model_name = getattr(settings, "gemini_model", "gemini-2.5-flash")
            self.model = genai.GenerativeModel(model_name)
            self.enabled = True

    # ---------------------------
    # Public API
    # ---------------------------

    async def extract_transactions_from_pdf(
        self, file_content: bytes, user_id: str, card_id: str
    ) -> Tuple[Optional[Dict[str, Any]], List[Transaction]]:
        """Extract card info and transactions from a PDF file using Gemini."""
        if not self.enabled:
            return None, self._fallback_transactions(user_id, card_id)

        try:
            # Prefer upload_file (preserves layout), fallback to raw text
            data = await self._call_gemini_with_pdf(file_content)
            card_info, transactions = self._coerce_to_output(data, user_id, card_id)
            return card_info, transactions

        except Exception as e:
            print(f"[GeminiService] Error processing PDF: {e}")
            return None, self._fallback_transactions(user_id, card_id)

    async def extract_transactions_from_image(
        self, file_content: bytes, user_id: str, card_id: str
    ) -> Tuple[Optional[Dict[str, Any]], List[Transaction]]:
        """Extract card info and transactions from an image file using Gemini Vision."""
        if not self.enabled:
            return None, self._fallback_transactions(user_id, card_id)

        try:
            data = await self._call_gemini_with_image(file_content)
            card_info, transactions = self._coerce_to_output(data, user_id, card_id)
            return card_info, transactions

        except Exception as e:
            print(f"[GeminiService] Error processing image: {e}")
            return None, self._fallback_transactions(user_id, card_id)

    # ---------------------------
    # Internal: Gemini calls
    # ---------------------------

    async def _call_gemini_with_pdf(self, file_content: bytes) -> Dict[str, Any]:
        """Call Gemini with PDF using upload_file if available; fallback to text extraction."""
        prompt = self._create_extraction_prompt()

        # Try using File API (best for structured docs)
        try:
            # Create a temporary file to pass to upload_file (requires a file path)
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(file_content)
                tmp_path = tmp.name
            
            try:
                uploaded = genai.upload_file(
                    tmp_path,
                    mime_type="application/pdf",
                    display_name="statement.pdf",
                )
                response = self.model.generate_content(
                    [prompt, uploaded],
                    generation_config={"response_mime_type": "application/json"},
                )
                return self._safe_json_load(response.text)
            finally:
                # Clean up temp file
                import os
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass
        except Exception as e:
            print(f"[GeminiService] upload_file failed, falling back to text extraction: {e}")

        # Fallback: extract plain text (less accurate for tables)
        text_content = self._extract_text_from_pdf(file_content)
        return self._call_gemini_with_text(prompt, text_content)

    async def _call_gemini_with_image(self, file_content: bytes) -> Dict[str, Any]:
        """Call Gemini Vision with image content."""
        prompt = self._create_extraction_prompt()
        try:
            image = Image.open(io.BytesIO(file_content))
            img_bytes, mime = self._image_to_bytes_and_mime(image)
            part = {"mime_type": mime, "data": img_bytes}

            response = self.model.generate_content(
                [prompt, part],
                generation_config={"response_mime_type": "application/json"},
            )
            return self._safe_json_load(response.text)
        except Exception as e:
            print(f"[GeminiService] Vision call failed: {e}")
            # If Vision fails, try OCR by extracting text (basic) — optional:
            # text_content = "[[IMAGE OCR NOT IMPLEMENTED]]"
            # return self._call_gemini_with_text(prompt, text_content)
            raise

    def _call_gemini_with_text(self, prompt: str, text_content: str) -> Dict[str, Any]:
        """Call Gemini with plain text content and ensure JSON-only output, with retry."""
        response = self.model.generate_content(
            [prompt, f"DOCUMENT CONTENT:\n{text_content}"],
            generation_config={"response_mime_type": "application/json"},
        )
        try:
            return self._safe_json_load(response.text)
        except Exception:
            # Retry with a minimal instruction reinforcing JSON-only
            retry_prompt = "Devuelve únicamente el JSON válido solicitado. No incluyas texto adicional."
            response2 = self.model.generate_content(
                [retry_prompt, f"DOCUMENT CONTENT:\n{text_content}"],
                generation_config={"response_mime_type": "application/json"},
            )
            return self._safe_json_load(response2.text)

    # ---------------------------
    # Internal: Parsing & Coercion
    # ---------------------------

    def _safe_json_load(self, text: str) -> Dict[str, Any]:
        """Parse JSON safely from model response, removing code fences and trailing noise."""
        clean = text.strip().replace("```json", "").replace("```", "").strip()

        # If the model added any leading/trailing non-JSON text, attempt to isolate with regex
        # Find first '{' and last '}' to slice a plausible JSON object
        start = clean.find("{")
        end = clean.rfind("}")
        if start != -1 and end != -1:
            candidate = clean[start : end + 1]
        else:
            candidate = clean

        data = json.loads(candidate)
        return data

    def _coerce_to_output(
        self, data: Dict[str, Any], user_id: str, card_id: str
    ) -> Tuple[Optional[Dict[str, Any]], List[Transaction]]:
        """
        Coerce the model JSON into (card_info, transactions) while validating and normalizing:
        - Support both new schema ("statement_summary", "transactions", "msi")
          and legacy "card_info"/"transactions".
        - Normalize amounts, dates; payments negative; categories fallback.
        """
        # If the response is legacy (has card_info), honor it
        card_info = data.get("card_info")
        transactions_raw = data.get("transactions", [])

        # If using the new schema, map to legacy card_info
        if not card_info and "statement_summary" in data:
            summary = data.get("statement_summary", {}) or {}
            card_info = self._map_summary_to_card_info(summary)

            # If transactions not at root, read them
            if not transactions_raw and "transactions" in data:
                transactions_raw = data.get("transactions", [])

        # Normalize transactions
        transactions: List[Transaction] = []
        cutoff_year = self._year_hint_from_summary(data.get("statement_summary"))

        for item in transactions_raw or []:
            # Amount normalization and type detection
            amount_val = self._normalize_amount(item.get("amount"))
            tx_type = "payment" if amount_val < 0 else "charge"
            final_amount = abs(amount_val) if tx_type == "payment" else amount_val

            # Date normalization (infer year if missing)
            date_str = (item.get("date") or "").strip()
            iso_date = self._normalize_date(date_str, cutoff_year=cutoff_year)

            # Category fallback
            category = item.get("category") or ("Payment" if tx_type == "payment" else "Other")

            # Validate and normalize installment_plan (should be int or None)
            installment_plan = item.get("installment_plan")
            if installment_plan is not None and not isinstance(installment_plan, int):
                try:
                    installment_plan = int(installment_plan) if installment_plan else None
                except (ValueError, TypeError):
                    installment_plan = None

            tx = Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                card_id=card_id,
                date=iso_date or datetime.utcnow().date().isoformat(),
                description=item.get("description") or "Unknown Transaction",
                category=category,
                amount=final_amount,
                type=tx_type,
                installment_plan=installment_plan,
            )
            transactions.append(tx)

        # Also process MSI plans from the separate msi section and convert them to transactions
        msi_section = data.get("msi", {})
        msi_plans = msi_section.get("plans", [])
        for msi_plan in msi_plans:
            # Add MSI transactions regardless of months_remaining (even if completed: 6/6)
            # We want to track all MSI history, not just pending ones
            total_amount = self._normalize_amount(msi_plan.get("total_purchase_amount", 0))
            installment_total = msi_plan.get("installment_total", 1)
            installment_index = msi_plan.get("installment_index", installment_total)  # Defaults to total if not provided (completed)
            purchase_date = msi_plan.get("purchase_date", "")
            iso_purchase_date = self._normalize_date(purchase_date, cutoff_year=cutoff_year)
            merchant = msi_plan.get("merchant", "MSI Purchase")
            
            # Create a transaction for this MSI plan
            msi_tx = Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                card_id=card_id,
                date=iso_purchase_date or datetime.utcnow().date().isoformat(),
                description=f"{merchant} (MSI {installment_index} of {installment_total})",
                category="MSI",
                amount=total_amount,
                type="charge",
                installment_plan=installment_total,  # Total months for the plan
                installments=installment_total,  # Alias for frontend
                months_paid=installment_index - 1,  # Months already paid (0-based): if index=6, then 5 months paid
            )
            transactions.append(msi_tx)
            print(f"[GeminiService] Added MSI transaction: {merchant} - ${total_amount} over {installment_total} months (currently at month {installment_index})")

        return card_info, transactions

    def _map_summary_to_card_info(self, summary: Dict[str, Any]) -> Dict[str, Any]:
        """Map new 'statement_summary' to legacy 'card_info' with safe defaults."""
        due_date_day = None
        due_date = summary.get("due_date")
        if due_date:
            try:
                # extract day as integer
                due_date_day = int(due_date.split("-")[-1])
            except Exception:
                pass

        card_info = {
            "name": summary.get("card_name"),
            "last4": summary.get("last4"),
            "issuer": summary.get("issuer"),
            "credit_limit": self._normalize_amount(summary.get("credit_limit")),
            "balance": self._normalize_amount(summary.get("total_balance")),
            "due_date_day": due_date_day,
            "minimum_payment": self._normalize_amount(summary.get("minimum_payment")),
            "no_interest_payment": self._normalize_amount(summary.get("no_interest_payment")),
            "cat": self._normalize_amount(summary.get("cat")),
            "currency": summary.get("currency"),
            "cutoff_date": summary.get("cutoff_date"),
            "statement_date": summary.get("cutoff_date"),  # Use cutoff_date as statement date to prevent stale updates
            "period_start": summary.get("period_start"),
            "period_end": summary.get("period_end"),
            "due_date": summary.get("due_date"),
            "period_balance": self._normalize_amount(summary.get("period_balance")),
        }
        return card_info

    # ---------------------------
    # Helpers: normalization
    # ---------------------------

    def _normalize_amount(self, value: Any) -> float:
        """Normalize amount from various formats to float (MX style and US style)."""
        if value is None:
            return 0.0
        if isinstance(value, (int, float)):
            return float(value)
        s = str(value).strip()

        # Remove currency symbols and spaces
        s = re.sub(r"[^\d,.\-]", "", s)

        # Handle formats like "1.234,56" (EU) vs "1,234.56" (US/MX)
        # If there are both comma and dot, decide decimal by the last occurrence
        if "," in s and "." in s:
            # If last separator is comma -> comma is decimal
            if s.rfind(",") > s.rfind("."):
                s = s.replace(".", "").replace(",", ".")
            else:
                s = s.replace(",", "")
        else:
            # Only comma -> treat as decimal separator
            if "," in s and "." not in s:
                s = s.replace(",", ".")

            # Only dot -> leave as is

        try:
            return float(s)
        except Exception:
            return 0.0

    def _normalize_date(self, value: str, cutoff_year: Optional[int] = None) -> Optional[str]:
        """
        Normalize date to ISO (YYYY-MM-DD).
        Supports inputs like '12 OCT', '12/10/2025', '2025-10-12'.
        If year missing, infer from cutoff_year.
        """
        if not value:
            return None

        v = value.strip().upper()

        # ISO already
        try:
            d = datetime.strptime(v, "%Y-%m-%d").date()
            return d.isoformat()
        except Exception:
            pass

        # Common locales: dd/mm/yyyy
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%m/%d/%Y", "%m-%d-%Y"):
            try:
                d = datetime.strptime(v, fmt).date()
                return d.isoformat()
            except Exception:
                continue

        # dd MON (spanish short month), infer year
        months = {
            "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
            "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12
        }
        m = re.match(r"^(\d{1,2})\s+([A-ZÁÉÍÓÚÑ]+)$", v)
        if m and cutoff_year:
            day = int(m.group(1))
            mon_abbr = m.group(2)
            month = months.get(mon_abbr, None)
            if month:
                try:
                    return date(cutoff_year, month, day).isoformat()
                except Exception:
                    pass

        # As last resort: return None (caller will substitute)
        return None

    def _year_hint_from_summary(self, summary: Optional[Dict[str, Any]]) -> Optional[int]:
        """Extract year hint from cutoff_date / period_end in statement_summary."""
        if not summary:
            return None
        for key in ("cutoff_date", "period_end", "due_date", "period_start"):
            v = summary.get(key)
            if v:
                try:
                    return datetime.strptime(v, "%Y-%m-%d").year
                except Exception:
                    continue
        return None

    def _extract_text_from_pdf(self, file_content: bytes) -> str:
        """Basic text extraction using PyPDF2 as a fallback."""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            out = []
            for page in pdf_reader.pages:
                out.append(page.extract_text() or "")
            return "\n".join(out)
        except Exception as e:
            print(f"[GeminiService] PyPDF2 text extraction failed: {e}")
            return ""

    def _image_to_bytes_and_mime(self, image: Image.Image) -> Tuple[bytes, str]:
        """Convert PIL Image to bytes and infer mime."""
        fmt = (image.format or "PNG").upper()
        buf = io.BytesIO()
        if fmt not in ("PNG", "JPEG", "JPG", "WEBP"):
            fmt = "PNG"
        image.save(buf, format=fmt)
        img_bytes = buf.getvalue()
        mime = f"image/{'jpeg' if fmt == 'JPG' else fmt.lower()}"
        if fmt == "JPG":
            mime = "image/jpeg"
        return img_bytes, mime

    # ---------------------------
    # Fallbacks
    # ---------------------------

    def _fallback_transactions(self, user_id: str, card_id: str) -> List[Transaction]:
        """Generate fallback mock transactions when Gemini is unavailable."""
        now = datetime.utcnow().date().isoformat()
        return [
            Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                card_id=card_id,
                date=now,
                description="Error procesando el estado - Intenta nuevamente",
                category="Other",
                amount=0.00,
                type="charge",
            ),
        ]

    # ---------------------------
    # Prompt provider
    # ---------------------------

    def _create_extraction_prompt(self) -> str:
        """Return the robust MX extraction prompt."""
        return PROMPT_MX

    # ---------------------------
    # Chat about finances
    # ---------------------------

    def chat_about_finances(self, user_question: str, financial_context: str) -> str:
        """
        Chat with Gemini about user's financial situation.
        
        Args:
            user_question: The user's question about their finances
            financial_context: Summary of user's cards, debts, and MSI
            
        Returns:
            Gemini's response in Spanish
        """
        # Use gemini-2.5-flash model for better quality responses
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = self._build_chat_prompt(user_question, financial_context)
        response = model.generate_content(prompt)
        return response.text if response else "No pude procesar tu pregunta. Por favor intenta de nuevo."

    def get_streaming_response(self, user_question: str, financial_context: str):
        """Get streaming response from Gemini."""
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = self._build_chat_prompt(user_question, financial_context)
        return model.generate_content(prompt, stream=True)

    def _build_chat_prompt(self, question: str, context: str) -> str:
        """Build chat prompt with user context."""
        return f"""Eres un asesor financiero personal experto en gestión de deudas y tarjetas de crédito mexicanas.

CONTEXTO FINANCIERO DEL USUARIO:
{context}

PREGUNTA:
{question}

INSTRUCCIONES:
1. Si el usuario saluda, responde brevemente sin mostrar datos no solicitados (máx 2-3 líneas).
2. Si pregunta sobre sus finanzas, usa el contexto y estructura con **títulos**, listas y formato claro.
3. NO muestres información financiera a menos que la pida explícitamente.
4. Sé conciso y práctico.
   - Sé claro y conciso

3. Formato:
   - Respuestas breves y directas
   - Usa **negrita** para puntos clave
   - Números (1., 2., 3.) para listas ordenadas
   - Guiones (-) para listas sin orden

4. Tono:
   - Amable y profesional
   - Evita tecnicismos
   - No bombardees con información

Responde ahora:"""


# Singleton instance
gemini_service = GeminiService()
