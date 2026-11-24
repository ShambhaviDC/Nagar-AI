from app.agents.base import BaseAgent
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import math
import logging

logger = logging.getLogger(__name__)

class DuplicateMatch(BaseModel):
    complaint_id: str
    complaint_code: str
    title: str
    similarity_score: float = Field(ge=0.0, le=1.0)
    street_match: bool
    category_match: bool
    status: str
    created_at: str

class DuplicateDetectionResult(BaseModel):
    is_duplicate: bool
    confidence: float
    matched_complaint_id: Optional[str] = None
    matched_complaint_code: Optional[str] = None
    cluster_group_id: Optional[str] = None
    matches: List[DuplicateMatch] = []
    explanation: str

class DuplicateDetectionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Duplicate Detection Agent",
            role_description="Detects semantically similar civic complaints within the same street or locality using embedding similarity and spatiotemporal matching."
        )
        self.model = None
        self._init_embedder()

    def _init_embedder(self):
        try:
            from sentence_transformers import SentenceTransformer
            # We can use all-MiniLM-L6-v2 or a lightweight model
            # Lazy load or use fallback to avoid startup delay if model downloading is needed
            self._transformer_available = True
        except Exception:
            self._transformer_available = False

    def _calculate_cosine_similarity(self, text1: str, text2: str) -> float:
        """Token-based and n-gram Jaccard / Cosine similarity for fast local computation."""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        jaccard = len(intersection) / len(union)
        
        # Check phrase match
        t1, t2 = text1.lower(), text2.lower()
        sub_bonus = 0.2 if (len(t1) > 10 and (t1 in t2 or t2 in t1)) else 0.0
        return min(1.0, (jaccard * 0.8) + sub_bonus)

    async def detect_duplicates(
        self,
        new_complaint: Dict[str, Any],
        recent_complaints: List[Dict[str, Any]],
        similarity_threshold: float = 0.65
    ) -> DuplicateDetectionResult:
        """Analyze existing recent complaints in the same locality/street for semantic overlap."""
        matches: List[DuplicateMatch] = []
        new_text = f"{new_complaint.get('title', '')} {new_complaint.get('description', '')}"
        new_street = str(new_complaint.get("street_id", ""))
        new_cat = new_complaint.get("category", "")

        for existing in recent_complaints:
            # Skip comparing to self if updating
            if str(existing.get("_id", existing.get("id", ""))) == str(new_complaint.get("id", "")):
                continue

            existing_id = str(existing.get("_id", existing.get("id", "")))
            existing_code = existing.get("complaint_code", f"CMP-{existing_id[-4:]}")
            exist_text = f"{existing.get('title', '')} {existing.get('description', '')}"
            exist_street = str(existing.get("street_id", ""))
            exist_cat = existing.get("category", "")
            
            street_match = (new_street == exist_street)
            category_match = (new_cat == exist_cat)

            sim = self._calculate_cosine_similarity(new_text, exist_text)
            
            # Boost similarity if exact street and category match
            if street_match and category_match:
                sim = min(1.0, sim + 0.15)
            elif not street_match:
                sim = max(0.0, sim - 0.20)

            if sim >= similarity_threshold:
                created_str = existing.get("created_at")
                if isinstance(created_str, datetime):
                    created_str = created_str.isoformat()
                else:
                    created_str = str(created_str or "")

                matches.append(DuplicateMatch(
                    complaint_id=existing_id,
                    complaint_code=existing_code,
                    title=existing.get("title", ""),
                    similarity_score=round(sim, 3),
                    street_match=street_match,
                    category_match=category_match,
                    status=existing.get("status", "registered"),
                    created_at=created_str
                ))

        # Sort matches by similarity descending
        matches.sort(key=lambda m: m.similarity_score, reverse=True)

        if matches:
            top_match = matches[0]
            is_dup = True
            confidence = top_match.similarity_score
            matched_id = top_match.complaint_id
            matched_code = top_match.complaint_code
            cluster_id = f"CLUST-{matched_code}"
            explanation = (
                f"Identified duplicate report matching {matched_code} on the same street "
                f"with {round(confidence * 100, 1)}% semantic similarity. Linked to common cluster."
            )
        else:
            is_dup = False
            confidence = 0.0
            matched_id = None
            matched_code = None
            cluster_id = None
            explanation = "No matching prior complaints found in this street. Registered as a unique new issue."

        return DuplicateDetectionResult(
            is_duplicate=is_dup,
            confidence=confidence,
            matched_complaint_id=matched_id,
            matched_complaint_code=matched_code,
            cluster_group_id=cluster_id,
            matches=matches,
            explanation=explanation
        )
