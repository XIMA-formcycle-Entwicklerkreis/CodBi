"""
Konvertiert ONNX-Modelle von S8×S8 zu U8×S8 Quantisierung.

Das Problem: Viele quantisierte ONNX-Modelle verwenden S8 (Signed Int8) für sowohl
Input als auch Gewichte, aber ONNX Runtime CPU-Kernels auf Windows/x64 unterstützen
oft nur U8×S8 (Unsigned Int8 Input, Signed Int8 Gewichte) wegen Intel VNNI.

Dieses Script konvertiert ConvInteger-Operatoren von S8×S8 zu U8×S8.
"""

import onnx
import numpy as np
from onnx import helper, numpy_helper
from onnx.helper import make_tensor_value_info, make_node, make_graph, make_model
import sys
import os


def convert_conv_integer_s8s8_to_u8s8(model_path: str, output_path: str):
    """
    Konvertiert ConvInteger-Operatoren von S8×S8 zu U8×S8.
    
    Args:
        model_path: Pfad zum Eingabe-ONNX-Modell
        output_path: Pfad für das konvertierte Modell
    """
    print(f"Lade Modell: {model_path}")
    model = onnx.load(model_path)
    
    graph = model.graph
    modified = False
    
    # Finde alle ConvInteger-Operatoren
    for node in graph.node:
        if node.op_type == "ConvInteger":
            print(f"  Gefunden: ConvInteger Node '{node.name}'")
            
            # Prüfe Input-Typen
            input_names = list(node.input)
            if len(input_names) < 2:
                print(f"    Warnung: ConvInteger hat weniger als 2 Inputs, überspringe")
                continue
            
            x_input = input_names[0]  # Input-Tensor
            w_input = input_names[1]  # Weight-Tensor
            
            # Finde Initializer für Input Zero-Point (falls vorhanden)
            x_zp_name = None
            w_zp_name = None
            
            # Suche nach Zero-Point-Initializern
            for init in graph.initializer:
                if init.name == x_input + "_zero_point" or init.name.endswith("_x_zero_point"):
                    x_zp_name = init.name
                if init.name == w_input + "_zero_point" or init.name.endswith("_w_zero_point"):
                    w_zp_name = init.name
            
            # Prüfe ob Input-Typ S8 ist (durch Initializer oder ValueInfo)
            x_type = None
            for vi in graph.input:
                if vi.name == x_input:
                    if vi.type.tensor_type.elem_type == onnx.TensorProto.INT8:
                        x_type = "INT8"
                        break
            
            # Prüfe auch in ValueInfo
            if x_type is None:
                for vi in graph.value_info:
                    if vi.name == x_input:
                        if vi.type.tensor_type.elem_type == onnx.TensorProto.INT8:
                            x_type = "INT8"
                            break
            
            # Prüfe Initializer für Input
            if x_type is None:
                for init in graph.initializer:
                    if init.name == x_input:
                        if init.data_type == onnx.TensorProto.INT8:
                            x_type = "INT8"
                            break
            
            if x_type == "INT8":
                print(f"    Input '{x_input}' ist INT8, konvertiere zu UINT8")
                
                # Erstelle neuen UINT8 Zero-Point (128 für S8->U8 Konvertierung)
                # S8: -128 bis 127, U8: 0 bis 255
                # Konvertierung: U8 = S8 + 128
                new_x_zp_name = x_input + "_u8_zero_point"
                
                # Prüfe ob Zero-Point bereits existiert
                existing_zp = None
                for init in graph.initializer:
                    if init.name == new_x_zp_name or (x_zp_name and init.name == x_zp_name):
                        existing_zp = init
                        break
                
                if existing_zp:
                    # Aktualisiere Zero-Point: U8_ZP = S8_ZP + 128
                    zp_value = numpy_helper.to_array(existing_zp)
                    new_zp_value = zp_value.astype(np.uint8) + 128
                    new_zp = numpy_helper.from_array(new_zp_value, new_x_zp_name)
                    
                    # Ersetze alten Zero-Point
                    graph.initializer.remove(existing_zp)
                    graph.initializer.append(new_zp)
                else:
                    # Erstelle neuen Zero-Point mit Wert 128
                    new_zp = numpy_helper.from_array(np.array([128], dtype=np.uint8), new_x_zp_name)
                    graph.initializer.append(new_zp)
                
                # Aktualisiere Input-Typ von INT8 zu UINT8
                for vi in graph.input:
                    if vi.name == x_input:
                        vi.type.tensor_type.elem_type = onnx.TensorProto.UINT8
                        modified = True
                        break
                
                for vi in graph.value_info:
                    if vi.name == x_input:
                        vi.type.tensor_type.elem_type = onnx.TensorProto.UINT8
                        modified = True
                        break
                
                # Aktualisiere Initializer-Typ falls Input ein Initializer ist
                for init in graph.initializer:
                    if init.name == x_input:
                        if init.data_type == onnx.TensorProto.INT8:
                            # Konvertiere Daten: S8 -> U8 (addiere 128)
                            data = numpy_helper.to_array(init)
                            data_u8 = (data.astype(np.int16) + 128).astype(np.uint8)
                            new_init = numpy_helper.from_array(data_u8, init.name)
                            new_init.data_type = onnx.TensorProto.UINT8
                            
                            graph.initializer.remove(init)
                            graph.initializer.append(new_init)
                            modified = True
                            break
                
                # Aktualisiere Node-Input-Referenz auf neuen Zero-Point
                if len(node.input) >= 3:
                    # Zero-Point ist bereits als Input vorhanden
                    node.input[2] = new_x_zp_name
                elif x_zp_name:
                    # Füge Zero-Point als Input hinzu
                    node.input.append(new_x_zp_name)
                
                print(f"    Konvertierung abgeschlossen für '{node.name}'")
    
    if modified:
        print(f"Speichere konvertiertes Modell: {output_path}")
        onnx.save(model, output_path)
        print("Konvertierung erfolgreich!")
        return True
    else:
        print("Keine Änderungen erforderlich.")
        return False


def main():
    if len(sys.argv) < 3:
        print("Verwendung: python convert_s8s8_to_u8s8.py <input_model.onnx> <output_model.onnx>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"Fehler: Eingabedatei nicht gefunden: {input_path}")
        sys.exit(1)
    
    try:
        convert_conv_integer_s8s8_to_u8s8(input_path, output_path)
    except Exception as e:
        print(f"Fehler bei der Konvertierung: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
