import torch
from transformers import VisionEncoderDecoderModel

def export_split_donut_onnx():
    model_name = "naver-clova-ix/donut-base-finetuned-docvqa"
    print(f"Loading model: {model_name}...")
    
    # Load model with eager attention to avoid SDPA issues
    model = VisionEncoderDecoderModel.from_pretrained(
        model_name,
        attn_implementation="eager"
    ).eval()

    # --- 1. ENCODER EXPORT ---
    print("Exporting encoder to ONNX...")
    encoder = model.get_encoder()
    
    class EncoderWrapper(torch.nn.Module):
        def __init__(self, encoder):
            super().__init__()
            self.encoder = encoder
        
        def forward(self, pixel_values):
            outputs = self.encoder(pixel_values)
            return outputs.last_hidden_state
    
    encoder_wrapper = EncoderWrapper(encoder).eval()
    
    # Dummy input for image (Donut standard: 1280x960)
    dummy_pixel_values = torch.randn(1, 3, 1280, 960)
    
    # Export encoder
    torch.onnx.export(
        encoder_wrapper,
        dummy_pixel_values,
        "donut-encoder.onnx",
        input_names=["pixel_values"],
        output_names=["last_hidden_state"],
        dynamic_axes={
            "pixel_values": {0: "batch_size"},
            "last_hidden_state": {0: "batch_size", 1: "sequence_length"}
        },
        opset_version=14,
        do_constant_folding=True,
        export_params=True,
        verbose=False,
        dynamo=False  # Use legacy exporter
    )
    print("✅ Encoder exported to donut-encoder.onnx")

    # --- 2. DECODER EXPORT ---
    print("Exporting decoder to ONNX...")
    decoder = model.get_decoder()
    
    class DecoderWrapper(torch.nn.Module):
        def __init__(self, decoder):
            super().__init__()
            self.decoder = decoder

        def forward(self, input_ids, encoder_hidden_states):
            outputs = self.decoder(
                input_ids=input_ids,
                encoder_hidden_states=encoder_hidden_states,
                use_cache=False  # Disable KV cache for ONNX
            )
            return outputs.logits
    
    decoder_wrapper = DecoderWrapper(decoder).eval()
    
    # Get actual encoder output shape for decoder
    with torch.no_grad():
        encoder_output = encoder(dummy_pixel_values)
        encoder_hidden_states = encoder_output.last_hidden_state
        print(f"Encoder output shape: {encoder_hidden_states.shape}")
    
    # Dummy inputs for decoder
    dummy_input_ids = torch.zeros((1, 64), dtype=torch.long)  # Full sequence length
    
    # Export decoder
    torch.onnx.export(
        decoder_wrapper,
        (dummy_input_ids, encoder_hidden_states),
        "donut-decoder.onnx",
        input_names=["input_ids", "encoder_hidden_states"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "encoder_hidden_states": {0: "batch_size", 1: "encoder_sequence_length"},
            "logits": {0: "batch_size", 1: "sequence_length"}
        },
        opset_version=14,
        do_constant_folding=True,
        export_params=True,
        verbose=False,
        dynamo=False  # Use legacy exporter
    )
    print("✅ Decoder exported to donut-decoder.onnx")
    print("Export complete!")

if __name__ == "__main__":
    export_split_donut_onnx()
