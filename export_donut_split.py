import torch
from transformers import VisionEncoderDecoderModel

def export_split_donut():
    model_name = "naver-clova-ix/donut-base-finetuned-docvqa"
    print(f"Lade Modell: {model_name}...")
    model = VisionEncoderDecoderModel.from_pretrained(model_name).eval()

    # --- 1. ENCODER EXPORT ---
    print("Extrahiere und trace Encoder...")
    encoder = model.get_encoder()

    # Dummy Input für das Bild (Donut Standard: 1280x960)
    dummy_pixel_values = torch.randn(1, 3, 1280, 960)

    with torch.no_grad():
        # Wir tracen nur den Encoder direkt - er gibt BaseModelOutput zurück
        # Wir brauchen last_hidden_state
        encoder_outputs = encoder(dummy_pixel_values)
        # Der Encoder gibt BaseModelOutput zurück, aber beim Trace müssen wir 
        # nur last_hidden_state zurückgeben
        class EncoderWrapper(torch.nn.Module):
            def __init__(self, encoder):
                super().__init__()
                self.encoder = encoder
            
            def forward(self, pixel_values):
                outputs = self.encoder(pixel_values)
                return outputs.last_hidden_state
        
        encoder_wrapper = EncoderWrapper(encoder)
        traced_encoder = torch.jit.trace(
            encoder_wrapper,
            (dummy_pixel_values,),
            strict=False
        )

    traced_encoder.save("donut_encoder.pt")
    print("✅ donut_encoder.pt gespeichert.")

    # --- 2. DECODER EXPORT ---
    print("Extrahiere und trace Decoder...")
    decoder = model.get_decoder()

    # Wir brauchen einen Wrapper für den Decoder, um die Argumentnamen
    # für TorchScript/DJL sauber zu halten.
    class DecoderWrapper(torch.nn.Module):
        def __init__(self, decoder):
            super().__init__()
            self.decoder = decoder

        def forward(self, input_ids, encoder_hidden_states):
            return self.decoder(
                input_ids=input_ids,
                encoder_hidden_states=encoder_hidden_states
            ).logits

    decoder_wrapper = DecoderWrapper(decoder)

    # Dummy Inputs für den Decoder-Trace
    # Donut Hidden Size = 1024, Sequenzlänge des Encoders meist ~1200
    dummy_input_ids = torch.zeros((1, 1), dtype=torch.long)
    dummy_encoder_hidden_states = torch.randn(1, 1200, 1024)

    with torch.no_grad():
        traced_decoder = torch.jit.trace(
            decoder_wrapper,
            (dummy_input_ids, dummy_encoder_hidden_states),
            strict=False
        )

    traced_decoder.save("donut_decoder.pt")
    print("✅ donut_decoder.pt gespeichert.")

if __name__ == "__main__":
    export_split_donut()
