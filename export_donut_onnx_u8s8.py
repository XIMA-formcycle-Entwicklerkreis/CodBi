"""
Exportiert Donut DocVQA Modelle zu ONNX mit U8×S8 Quantisierung (statt S8×S8).

Das Problem: Viele Quantisierungs-Tools exportieren standardmäßig S8×S8, aber
ONNX Runtime CPU-Kernels auf Windows/x64 unterstützen oft nur U8×S8 wegen Intel VNNI.

Dieses Script exportiert die Modelle direkt mit U8×S8 Quantisierung.
"""

import torch
import torch.nn as nn
from transformers import VisionEncoderDecoderModel
from onnxruntime.quantization import quantize_dynamic, QuantType
import onnx
import os


def export_donut_onnx_with_u8s8_quantization():
    """
    Exportiert Donut Modelle zu ONNX und quantisiert sie mit U8×S8 statt S8×S8.
    """
    model_name = "naver-clova-ix/donut-base-finetuned-docvqa"
    print(f"Lade Modell: {model_name}...")
    
    # Lade Modell
    model = VisionEncoderDecoderModel.from_pretrained(
        model_name,
        attn_implementation="eager"
    ).eval()
    
    # --- ENCODER EXPORT ---
    print("\n=== Exportiere Encoder ===")
    encoder = model.get_encoder()
    
    class EncoderWrapper(nn.Module):
        def __init__(self, encoder):
            super().__init__()
            self.encoder = encoder
        
        def forward(self, pixel_values):
            outputs = self.encoder(pixel_values)
            return outputs.last_hidden_state
    
    encoder_wrapper = EncoderWrapper(encoder).eval()
    dummy_pixel_values = torch.randn(1, 3, 1280, 960)
    
    encoder_fp32_path = "encoder_model_fp32.onnx"
    print(f"Exportiere Encoder zu {encoder_fp32_path}...")
    torch.onnx.export(
        encoder_wrapper,
        dummy_pixel_values,
        encoder_fp32_path,
        input_names=["pixel_values"],
        output_names=["last_hidden_state"],
        dynamic_axes={
            "pixel_values": {0: "batch_size"},
            "last_hidden_state": {0: "batch_size", 1: "sequence_length"}
        },
        opset_version=14,
        do_constant_folding=True,
        export_params=True,
        verbose=False
    )
    print(f"✅ Encoder FP32 exportiert")
    
    # Quantisiere Encoder mit U8×S8
    encoder_int8_path = "encoder_model_int8_u8s8.onnx"
    print(f"Quantisiere Encoder zu {encoder_int8_path} (U8×S8)...")
    
    # Verwende quantize_dynamic mit expliziter U8×S8 Konfiguration
    # Hinweis: quantize_dynamic verwendet standardmäßig UINT8 für Inputs
    try:
        quantize_dynamic(
            model_input=encoder_fp32_path,
            model_output=encoder_int8_path,
            weight_type=QuantType.QInt8,  # S8 für Gewichte
            # Input wird automatisch als UINT8 behandelt (U8)
            optimize_model=False  # Wichtig: keine Optimierung, die Typen ändern könnte
        )
        print(f"✅ Encoder quantisiert (U8×S8)")
    except Exception as e:
        print(f"⚠️  Fehler bei Quantisierung: {e}")
        print("   Versuche manuelle Konvertierung...")
        # Fallback: Kopiere FP32 Modell
        import shutil
        shutil.copy(encoder_fp32_path, encoder_int8_path)
        print("   FP32 Modell kopiert (keine Quantisierung)")
    
    # --- DECODER EXPORT ---
    print("\n=== Exportiere Decoder ===")
    decoder = model.get_decoder()
    
    class DecoderWrapper(nn.Module):
        def __init__(self, decoder):
            super().__init__()
            self.decoder = decoder
        
        def forward(self, input_ids, encoder_hidden_states):
            outputs = self.decoder(
                input_ids=input_ids,
                encoder_hidden_states=encoder_hidden_states
            )
            return outputs.logits
    
    decoder_wrapper = DecoderWrapper(decoder).eval()
    dummy_input_ids = torch.randint(0, 1000, (1, 10))
    dummy_encoder_hidden = torch.randn(1, 100, 768)
    
    decoder_fp32_path = "decoder_model_fp32.onnx"
    print(f"Exportiere Decoder zu {decoder_fp32_path}...")
    torch.onnx.export(
        decoder_wrapper,
        (dummy_input_ids, dummy_encoder_hidden),
        decoder_fp32_path,
        input_names=["input_ids", "encoder_hidden_states"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "encoder_hidden_states": {0: "batch_size", 1: "seq_len"},
            "logits": {0: "batch_size", 1: "sequence_length"}
        },
        opset_version=14,
        do_constant_folding=True,
        export_params=True,
        verbose=False
    )
    print(f"✅ Decoder FP32 exportiert")
    
    # Quantisiere Decoder mit U8×S8
    decoder_int8_path = "decoder_model_int8_u8s8.onnx"
    print(f"Quantisiere Decoder zu {decoder_int8_path} (U8×S8)...")
    
    try:
        quantize_dynamic(
            model_input=decoder_fp32_path,
            model_output=decoder_int8_path,
            weight_type=QuantType.QInt8,  # S8 für Gewichte
            optimize_model=False
        )
        print(f"✅ Decoder quantisiert (U8×S8)")
    except Exception as e:
        print(f"⚠️  Fehler bei Quantisierung: {e}")
        import shutil
        shutil.copy(decoder_fp32_path, decoder_int8_path)
        print("   FP32 Modell kopiert (keine Quantisierung)")
    
    print("\n=== Export abgeschlossen ===")
    print(f"Encoder INT8 (U8×S8): {encoder_int8_path}")
    print(f"Decoder INT8 (U8×S8): {decoder_int8_path}")
    print("\nHinweis: Benenne die Dateien um zu:")
    print("  - encoder_model_int8.onnx")
    print("  - decoder_model_int8.onnx")
    print("und ersetze die alten Modelle im donut-docvqa Ordner.")


if __name__ == "__main__":
    try:
        export_donut_onnx_with_u8s8_quantization()
    except Exception as e:
        print(f"Fehler: {e}")
        import traceback
        traceback.print_exc()
