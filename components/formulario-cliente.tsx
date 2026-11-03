import Boton from "@/components/boton";
import Campo from "@/components/campo";
import Chip from "@/components/chip";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { TIPOS_CLIENTE, type DatosCliente } from "@/database/clientes";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  valoresIniciales?: DatosCliente;
  textoBoton?: string;
  onGuardar: (datos: DatosCliente) => Promise<void>;
};

// Formulario que se reutiliza tanto para registrar un cliente nuevo como
// para editar uno ya existente. Los campos vacios se marcan en rojo.
const FormularioCliente = ({
  valoresIniciales,
  textoBoton = "Guardar cliente",
  onGuardar,
}: Props) => {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [direccionVereda, setDireccionVereda] = useState(
    valoresIniciales?.direccionVereda ?? ""
  );
  const [idTipoCliente, setIdTipoCliente] = useState<number | null>(
    valoresIniciales?.idTipoCliente ?? null
  );
  const [errores, setErrores] = useState({
    nombre: false,
    direccionVereda: false,
    tipo: false,
  });
  const [mensajeError, setMensajeError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const manejarGuardar = async () => {
    const sinNombre = nombre.trim().length === 0;
    const sinVereda = direccionVereda.trim().length === 0;
    const sinTipo = idTipoCliente === null;

    setErrores({ nombre: sinNombre, direccionVereda: sinVereda, tipo: sinTipo });

    if (sinNombre || sinVereda || sinTipo) {
      setMensajeError("Completa todos los campos.");
      return;
    }

    setMensajeError("");
    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        direccionVereda: direccionVereda.trim(),
        idTipoCliente,
      });
    } catch (error) {
      setMensajeError(
        error instanceof Error ? error.message : "No se pudo guardar el cliente."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Tarjeta estilo={style.contenedor}>
      <Campo
        etiqueta="Nombre del cliente"
        valor={nombre}
        onCambiar={setNombre}
        marcarError={errores.nombre}
        capitalizar="words"
      />
      <Campo
        etiqueta="Dirección o vereda"
        valor={direccionVereda}
        onCambiar={setDireccionVereda}
        marcarError={errores.direccionVereda}
        capitalizar="words"
      />

      <View style={style.bloqueTipo}>
        <Text style={style.etiqueta}>Tipo de cliente</Text>
        <View style={[style.filaChips, errores.tipo && style.filaChipsError]}>
          {TIPOS_CLIENTE.map((tipo) => (
            <Chip
              key={tipo.id_tipo_cliente}
              texto={tipo.nombre}
              seleccionado={idTipoCliente === tipo.id_tipo_cliente}
              onPress={() => setIdTipoCliente(tipo.id_tipo_cliente)}
            />
          ))}
        </View>
      </View>

      {mensajeError.length > 0 && (
        <Text style={style.mensajeError}>{mensajeError}</Text>
      )}

      <Boton
        texto={guardando ? "Guardando..." : textoBoton}
        onPress={manejarGuardar}
        deshabilitado={guardando}
      />
    </Tarjeta>
  );
};

const style = StyleSheet.create({
  contenedor: {
    gap: 16,
  },
  bloqueTipo: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.textoSuave,
  },
  filaChips: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  filaChipsError: {
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: 12,
    padding: 8,
  },
  mensajeError: {
    color: colores.error,
    fontSize: 15,
  },
});

export default FormularioCliente;
