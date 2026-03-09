"""
GPU Acceleration Module - Enterprise-Grade ML Inference

This module provides GPU-accelerated operations for:
- Machine Learning inference (10-100x faster)
- Feature engineering with cuDF
- Model training with cuML
- Real-time signal processing

Supported Backends:
- NVIDIA CUDA (primary)
- Apple Metal (fallback for M1/M2)
- CPU (fallback)
"""

from .cuda_engine import GPUEngine, get_gpu_engine
from .ml_inference import GPUMLInference, ModelType
from .optimizations import GPUOptimizer

__all__ = [
    "GPUEngine",
    "get_gpu_engine",
    "GPUMLInference",
    "ModelType",
    "GPUOptimizer",
]
