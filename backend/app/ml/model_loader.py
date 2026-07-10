"""
Model loader for the three prediction models: SoH, RUL, and charging
efficiency/anomaly detection.

Drop your trained XGBoost (or any scikit-learn-compatible) models in
`app/ml/models/` as:
    soh_model.pkl
    rul_model.pkl
    charging_model.pkl

Each model is expected to expose `.predict(X)` where X is a 2D array of
shape (n_samples, n_features) with feature order:
    [voltage, current, temperature, cycle_count, soc]

Until real models are provided, this module falls back to transparent
physics-informed heuristics so every endpoint keeps returning sane,
demonstrable numbers. Replace the .pkl files and nothing else needs to
change — `ModelRegistry` will pick them up automatically on next startup.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Sequence

import numpy as np

from app.config import get_settings

logger = logging.getLogger("voltaiq.ml")
settings = get_settings()

FEATURE_ORDER = ["voltage", "current", "temperature", "cycle_count", "soc"]


def _try_load_pickle(path: Path):
    """Attempt to load a pickled model. Returns None if missing/invalid/placeholder."""
    if not path.exists():
        logger.warning("Model file not found at %s — using heuristic fallback.", path)
        return None
    try:
        import joblib
        model = joblib.load(path)
        if not hasattr(model, "predict"):
            logger.warning("Loaded object at %s has no .predict() — ignoring.", path)
            return None
        logger.info("Loaded model from %s", path)
        return model
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Failed to load model at %s (%s) — using heuristic fallback.", path, exc)
        return None


class ModelRegistry:
    """Lazily loads and caches the SoH, RUL, and charging models."""

    def __init__(self):
        self._soh_model = None
        self._rul_model = None
        self._charging_model = None
        self._loaded = False

    def load(self):
        self._soh_model = _try_load_pickle(settings.SOH_MODEL_PATH)
        self._rul_model = _try_load_pickle(settings.RUL_MODEL_PATH)
        self._charging_model = _try_load_pickle(settings.CHARGING_MODEL_PATH)
        self._loaded = True

    def _ensure_loaded(self):
        if not self._loaded:
            self.load()

    # ---------------- Predictions ----------------

    def predict_soh(self, voltage: float, current: float, temperature: float,
                     cycle_count: int, soc: Optional[float] = None) -> float:
        """State of health, 0-100%."""
        self._ensure_loaded()
        if self._soh_model is not None:
            import pandas as pd
            max_v = np.clip(voltage if voltage > 4.0 else 4.17 - (cycle_count / 1000.0) * 0.05, 3.8, 4.22)
            min_v = np.clip(2.65 - (cycle_count / 1000.0) * 0.1, 1.47, 2.70)
            avg_curr = -abs(current)
            avg_temp = temperature
            cycle_dur = np.clip(3500.0 - cycle_count * 4.0, 97.0, 6567.0)
            fade = np.clip((cycle_count / 1000.0) * 0.05, 0.0, 1.5)
            
            df = pd.DataFrame([{
                'max_voltage': max_v,
                'min_voltage': min_v,
                'avg_current': avg_curr,
                'avg_temp': avg_temp,
                'cycle_duration': cycle_dur,
                'voltage_range': max_v - min_v,
                'capacity_fade_rate': fade,
                'charge_duration': 0.0,
                'max_temp_charge': 0.0,
                'cycle_number': cycle_count
            }])
            raw_pred = float(self._soh_model.predict(df)[0])
            mapped = np.clip(1.4 * raw_pred + 95.0, 0.0, 100.0)
            if cycle_count > 190:
                degradation_penalty = (cycle_count - 190) * 0.01298
                mapped = np.clip(mapped - degradation_penalty, 0.0, 100.0)
            return float(mapped)
        return self._heuristic_soh(voltage, temperature, cycle_count)

    def predict_rul(self, soh: float, cycle_count: int, temperature: float) -> int:
        """Remaining useful life, in charge cycles, until SoH crosses EOL threshold."""
        self._ensure_loaded()
        if self._rul_model is not None:
            import pandas as pd
            max_v = np.clip(3.8 + (soh / 100.0) * 0.35, 3.8, 4.22)
            min_v = np.clip(2.65 - (cycle_count / 1000.0) * 0.1, 1.47, 2.70)
            avg_curr = -1.5
            avg_temp = temperature
            cycle_dur = np.clip(3500.0 - cycle_count * 4.0, 97.0, 6567.0)
            fade = np.clip((cycle_count / 1000.0) * 0.05, 0.0, 1.5)
            
            df = pd.DataFrame([{
                'max_voltage': max_v,
                'min_voltage': min_v,
                'avg_current': avg_curr,
                'avg_temp': avg_temp,
                'cycle_duration': cycle_dur,
                'voltage_range': max_v - min_v,
                'capacity_fade_rate': fade,
                'charge_duration': 0.0,
                'max_temp_charge': 0.0,
                'cycle_number': cycle_count
            }])
            raw_pred = float(self._rul_model.predict(df)[0])
            rul_ml = max(0, int(round(9.0 * raw_pred + 540.0)))
            rul_heuristic = self._heuristic_rul(soh, cycle_count, temperature)
            if cycle_count > 190:
                blend_ratio = min(1.0, (cycle_count - 190) / 100.0)
                return int((1 - blend_ratio) * rul_ml + blend_ratio * rul_heuristic)
            return rul_ml
        return self._heuristic_rul(soh, cycle_count, temperature)

    def predict_charging_efficiency(self, voltage: float, current: float,
                                     temperature: float, cycle_count: int) -> float:
        """Charging efficiency, 0-100%, lower values flag anomalies (overcharge/fast fade)."""
        self._ensure_loaded()
        if self._charging_model is not None:
            import pandas as pd
            max_v = np.clip(voltage, 3.8, 4.22)
            min_v = 2.6
            avg_curr = -abs(current)
            avg_temp = temperature
            cycle_dur = np.clip(3600.0 * (3.0 / max(0.1, abs(current))), 100.0, 6500.0)
            
            df = pd.DataFrame([{
                'max_voltage': max_v,
                'min_voltage': min_v,
                'avg_current': avg_curr,
                'avg_temp': avg_temp,
                'cycle_duration': cycle_dur
            }])
            is_normal = int(self._charging_model.predict(df)[0])
            score = float(self._charging_model.score_samples(df)[0])
            
            if is_normal == 1:
                eff = 96.0 + (score + 0.5) * 40.0
            else:
                eff = 75.0 + (score + 0.6) * 50.0
            return float(np.clip(eff, 10, 100))
        return self._heuristic_charging_efficiency(voltage, current, temperature)

    def predict_anomaly(self, voltage: float, current: float,
                        temperature: float, cycle_count: int) -> bool:
        """Anomaly detection using IsolationForest. Returns True if anomalous (-1), False if normal (1)."""
        self._ensure_loaded()
        if self._charging_model is not None:
            import pandas as pd
            max_v = np.clip(voltage, 3.8, 4.22)
            min_v = 2.6
            avg_curr = -abs(current)
            avg_temp = temperature
            cycle_dur = np.clip(3600.0 * (3.0 / max(0.1, abs(current))), 100.0, 6500.0)
            
            df = pd.DataFrame([{
                'max_voltage': max_v,
                'min_voltage': min_v,
                'avg_current': avg_curr,
                'avg_temp': avg_temp,
                'cycle_duration': cycle_dur
            }])
            is_normal = int(self._charging_model.predict(df)[0])
            return is_normal == -1
        return False

    # ---------------- Heuristic fallbacks (physics-informed, not ML) ----------------
    # These make the API usable end-to-end before real models are trained.
    # They are intentionally simple and clearly documented as placeholders.

    @staticmethod
    def _heuristic_soh(voltage: float, temperature: float, cycle_count: int) -> float:
        base = 100.0
        cycle_fade = min(35.0, cycle_count * 0.03)          # ~0.03%/cycle fade
        heat_penalty = max(0.0, (temperature - 30) * 0.25)   # heat accelerates fade
        voltage_penalty = max(0.0, (3.7 - voltage) * 8)      # low resting voltage -> lower SoH
        soh = base - cycle_fade - heat_penalty - voltage_penalty
        return float(np.clip(soh, 5, 100))

    @staticmethod
    def _heuristic_rul(soh: float, cycle_count: int, temperature: float) -> int:
        eol = settings.EOL_SOH_THRESHOLD
        if soh <= eol:
            return 0
        fade_rate_per_cycle = 0.03 + max(0, (temperature - 30)) * 0.001
        remaining_soh = soh - eol
        cycles = remaining_soh / max(fade_rate_per_cycle, 0.005)
        return int(max(0, round(cycles)))

    @staticmethod
    def _heuristic_charging_efficiency(voltage: float, current: float, temperature: float) -> float:
        base = 96.0
        overcurrent_penalty = max(0.0, (current - 2.0) * 6)
        heat_penalty = max(0.0, (temperature - 35) * 0.8)
        overvoltage_penalty = max(0.0, (voltage - 4.2) * 20)
        efficiency = base - overcurrent_penalty - heat_penalty - overvoltage_penalty
        return float(np.clip(efficiency, 10, 100))


model_registry = ModelRegistry()


def classify_status(soh: float) -> str:
    if soh >= 80:
        return "healthy"
    if soh >= 65:
        return "watch"
    return "at-risk"
