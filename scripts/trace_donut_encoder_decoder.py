#!/usr/bin/env python3
"""
Script to trace Donut DocVQA model into separate Encoder and Decoder models.

This script loads the original Donut model from HuggingFace and traces the encoder
and decoder separately to enable caching of encoder hidden states during inference.

Usage:
    python trace_donut_encoder_decoder.py --model_name Callari/donut-docvqa --output_dir ./models
"""

import argparse
import torch
from transformers import DonutProcessor, VisionEncoderDecoderModel
import os


def trace_encoder_decoder(model_name: str, output_dir: str):
    """
    Traces the encoder and decoder of a Donut model separately.
    
    This function loads the ORIGINAL model from HuggingFace (not a traced version)
    and creates separate traced encoder and decoder models.
    
    Args:
        model_name: HuggingFace model name (e.g., "Callari/donut-docvqa")
        output_dir: Directory where the traced models will be saved
    """
    print(f"Loading ORIGINAL model from HuggingFace: {model_name}")
    print("Note: This requires the original PyTorch model, not a traced .pt file")
    
    # Load the original model from HuggingFace
    model = VisionEncoderDecoderModel.from_pretrained(model_name)
    model.eval()
    
    print(f"Model loaded successfully. Encoder type: {type(model.encoder)}, Decoder type: {type(model.decoder)}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Image dimensions used by Donut
    image_height = 960
    image_width = 1280
    batch_size = 1
    
    # Create dummy inputs for tracing
    print("Creating dummy inputs for tracing...")
    dummy_image = torch.randn(batch_size, 3, image_height, image_width)
    
    # For decoder, we need encoder output and decoder input
    # First, get encoder output
    print("Getting encoder output...")
    with torch.no_grad():
        encoder_outputs = model.encoder(dummy_image)
        # encoder_outputs is a BaseModelOutput, we need the last_hidden_state
        encoder_hidden_states = encoder_outputs.last_hidden_state
    
    # Decoder input: typical sequence length for prompts
    decoder_seq_length = 20
    dummy_decoder_input_ids = torch.randint(0, model.decoder.config.vocab_size, (batch_size, decoder_seq_length))
    
    print("Tracing encoder...")
    # Trace encoder
    with torch.no_grad():
        encoder_traced = torch.jit.trace(model.encoder, dummy_image)
    
    encoder_path = os.path.join(output_dir, "encoder.pt")
    encoder_traced.save(encoder_path)
    print(f"Encoder saved to: {encoder_path}")
    
    print("Tracing decoder...")
    # For decoder, we need to create a wrapper that takes encoder_hidden_states and decoder_input_ids
    # The decoder expects encoder_hidden_states as part of the forward call
    def decoder_forward_wrapper(decoder_input_ids, encoder_hidden_states):
        return model.decoder(
            input_ids=decoder_input_ids,
            encoder_hidden_states=encoder_hidden_states
        )
    
    # Trace decoder with encoder_hidden_states
    with torch.no_grad():
        decoder_traced = torch.jit.trace(
            decoder_forward_wrapper,
            (dummy_decoder_input_ids, encoder_hidden_states),
            strict=False
        )
    
    decoder_path = os.path.join(output_dir, "decoder.pt")
    decoder_traced.save(decoder_path)
    print(f"Decoder saved to: {decoder_path}")
    
    print("Tracing complete!")
    print(f"Models saved to: {output_dir}")
    print("\nNote: The traced models expect specific input shapes:")
    print(f"  Encoder: [batch_size, 3, {image_height}, {image_width}]")
    print(f"  Decoder: decoder_input_ids [batch_size, seq_len], encoder_hidden_states [batch_size, encoder_seq_len, hidden_size]")


if __name__ == "__main__":
    import sys
    
    # Check if running in Colab/Jupyter (has IPython)
    try:
        get_ipython()
        # Running in Jupyter/Colab - use default parameters or allow direct function call
        # Users can call trace_encoder_decoder() directly with their parameters
        trace_encoder_decoder(
            model_name="Callari/donut-docvqa",
            output_dir="./traced_models"
        )
    except NameError:
        # Running as script - parse command line arguments
        # Filter out Jupyter/Colab kernel arguments (-f and the following file path)
        filtered_args = []
        skip_next = False
        for arg in sys.argv[1:]:
            if arg == '-f':
                skip_next = True
            elif skip_next:
                skip_next = False
            else:
                filtered_args.append(arg)
        
        parser = argparse.ArgumentParser(description="Trace Donut model into encoder and decoder")
        parser.add_argument(
            "--model_name",
            type=str,
            default="Callari/donut-docvqa",
            help="HuggingFace model name (default: Callari/donut-docvqa)"
        )
        parser.add_argument(
            "--output_dir",
            type=str,
            default="./traced_models",
            help="Output directory for traced models (default: ./traced_models)"
        )
        
        args = parser.parse_args(filtered_args)
        
        trace_encoder_decoder(args.model_name, args.output_dir)
