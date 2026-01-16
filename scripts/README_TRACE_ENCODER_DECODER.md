# Donut Encoder/Decoder Tracing

Dieses Skript ermöglicht es, das Donut DocVQA-Modell in separate Encoder- und Decoder-Modelle zu trennen, um die Performance zu optimieren.

## Voraussetzungen

1. Python 3.7+
2. PyTorch
3. Transformers-Bibliothek
4. Zugriff auf das Original-Modell von HuggingFace (nicht nur die getracede .pt Datei)

## Installation

```bash
pip install torch transformers
```

## Verwendung

### In Google Colab (empfohlen)

**Option 1: Funktion direkt aufrufen (empfohlen)**
```python
# Skript hochladen oder klonen, dann in einer Colab-Zelle:
exec(open('trace_donut_encoder_decoder.py').read())

# Oder die Funktion direkt importieren und aufrufen:
from trace_donut_encoder_decoder import trace_encoder_decoder

trace_encoder_decoder(
    model_name="Callari/donut-docvqa",
    output_dir="./traced_models"
)
```

**Option 2: Als Skript ausführen**
```bash
!python trace_donut_encoder_decoder.py --model_name Callari/donut-docvqa --output_dir ./traced_models
```

### Lokal (Kommandozeile)

```bash
python scripts/trace_donut_encoder_decoder.py --model_name Callari/donut-docvqa --output_dir ./traced_models
```

## Ausgabe

Das Skript erstellt zwei separate Modelldateien:
- `encoder.pt`: Encoder-Modell (verarbeitet Bilder)
- `decoder.pt`: Decoder-Modell (generiert Text basierend auf Encoder-Output)

## Integration in Kotlin-Code

Die getraceden Modelle können dann im Kotlin-Code verwendet werden, um die Encoder-Hidden-States zu cachen und nur den Decoder in der Autoregressions-Schleife auszuführen.

## Hinweise

- Das Original-Modell wird benötigt (nicht nur die bereits getracede Version)
- Die getraceden Modelle müssen mit der gleichen PyTorch-Version kompatibel sein wie die Runtime
- Die Input-Shapes müssen exakt übereinstimmen
- In Colab wird empfohlen, die Funktion direkt aufzurufen, anstatt das Skript mit `%run` auszuführen
