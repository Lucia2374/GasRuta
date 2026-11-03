import Boton from "@/components/boton";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { TIPOS_CLIENTE } from "@/database/clientes";
import { consultarPrecio, guardarPrecio, listarPesos, type Peso } from "@/database/precios";
import { useSesion } from "@/hooks/use-sesion";
import { avisar } from "@/utils/alerta";
import { formatoPesos, textoANumero } from "@/utils/formato";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

// Clave para guardar en el estado el precio de un peso para un tipo de cliente.
const clavePrecio = (idPeso: number, idTipoCliente: number) => `${idPeso}-${idTipoCliente}`;

// Pantalla de precios (HU-07 y HU-08). El titular puede editarlos, el
// asistente solo los puede consultar.
const Precios = () => {
  const db = useSQLiteContext();
  const { sesion, cargando: cargandoSesion } = useSesion();

  const [pesos, setPesos] = useState<Peso[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Record<string, boolean>>({});
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarPrecios = useCallback(async () => {
    const listaPesos = await listarPesos(db);
    setPesos(listaPesos);

    const nuevosValores: Record<string, string> = {};
    for (const peso of listaPesos) {
      for (const tipo of TIPOS_CLIENTE) {
        const valor = await consultarPrecio(db, peso.id_peso, tipo.id_tipo_cliente);
        nuevosValores[clavePrecio(peso.id_peso, tipo.id_tipo_cliente)] =
          valor !== null ? String(valor) : "";
      }
    }
    setValores(nuevosValores);
    setCargandoDatos(false);
  }, [db]);

  useEffect(() => {
    cargarPrecios();
  }, [cargarPrecios]);

  const cambiarValor = (clave: string, texto: string) => {
    setValores((anterior) => ({ ...anterior, [clave]: texto }));
  };

  const guardarTodo = async () => {
    const nuevosErrores: Record<string, boolean> = {};
    let hayError = false;

    for (const peso of pesos) {
      for (const tipo of TIPOS_CLIENTE) {
        const clave = clavePrecio(peso.id_peso, tipo.id_tipo_cliente);
        const texto = (valores[clave] ?? "").trim();
        if (texto.length === 0) {
          continue;
        }
        if (textoANumero(texto) <= 0) {
          nuevosErrores[clave] = true;
          hayError = true;
        }
      }
    }

    setErrores(nuevosErrores);

    if (hayError) {
      setMensaje("Revisa los precios marcados en rojo, deben ser mayores que 0.");
      return;
    }

    setMensaje("");
    setGuardando(true);
    try {
      for (const peso of pesos) {
        for (const tipo of TIPOS_CLIENTE) {
          const clave = clavePrecio(peso.id_peso, tipo.id_tipo_cliente);
          const texto = (valores[clave] ?? "").trim();
          if (texto.length === 0) {
            continue;
          }
          await guardarPrecio(db, peso.id_peso, tipo.id_tipo_cliente, textoANumero(texto));
        }
      }
      avisar("Precios guardados", "Los precios quedaron actualizados.");
      await cargarPrecios();
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudieron guardar los precios."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoSesion || cargandoDatos || !sesion) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>Cargando precios...</Text>
      </View>
    );
  }

  const esTitular = sesion.rol === "TITULAR";

  return (
    <ScrollView style={style.contenedor} contentContainerStyle={style.contenido}>
      <Tarjeta estilo={style.tarjetaTabla}>
        {!esTitular && (
          <Text style={style.aviso}>Solo el titular puede cambiarlos.</Text>
        )}

        <View style={style.filaEncabezado}>
          <Text style={[style.encabezadoTexto, style.columnaCilindro]}>Cilindro</Text>
          <Text style={[style.encabezadoTexto, style.columna]}>🏠 Hogar</Text>
          <Text style={[style.encabezadoTexto, style.columna]}>🏪 Negocio</Text>
        </View>

        {pesos.map((peso) => (
          <View key={peso.id_peso} style={style.filaDatos}>
            <Text style={[style.celdaTexto, style.columnaCilindro]}>{peso.descripcion}</Text>

            {TIPOS_CLIENTE.map((tipo) => {
              const clave = clavePrecio(peso.id_peso, tipo.id_tipo_cliente);
              const valorTexto = valores[clave] ?? "";

              if (esTitular) {
                return (
                  <TextInput
                    key={clave}
                    style={[style.input, style.columna, errores[clave] && style.inputError]}
                    value={valorTexto}
                    onChangeText={(texto) => cambiarValor(clave, texto)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colores.textoSuave}
                  />
                );
              }

              return (
                <Text key={clave} style={[style.celdaTexto, style.columna]}>
                  {valorTexto.length > 0 ? formatoPesos(Number(valorTexto)) : "Sin precio"}
                </Text>
              );
            })}
          </View>
        ))}
      </Tarjeta>

      {esTitular && (
        <View style={style.bloqueGuardar}>
          {mensaje.length > 0 && <Text style={style.mensajeError}>{mensaje}</Text>}
          <Boton
            texto={guardando ? "Guardando..." : "Guardar precios"}
            onPress={guardarTodo}
            deshabilitado={guardando}
          />
        </View>
      )}
    </ScrollView>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
    gap: 16,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tarjetaTabla: {
    gap: 10,
  },
  aviso: {
    fontSize: 15,
    color: colores.textoSuave,
    marginBottom: 6,
  },
  filaEncabezado: {
    flexDirection: "row",
    gap: 8,
  },
  filaDatos: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  columnaCilindro: {
    flex: 1.2,
  },
  columna: {
    flex: 1,
  },
  encabezadoTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.textoSuave,
  },
  celdaTexto: {
    fontSize: 16,
    color: colores.texto,
    paddingVertical: 10,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 16,
    paddingHorizontal: 10,
    fontSize: 16,
    color: colores.texto,
    backgroundColor: colores.blanco,
  },
  inputError: {
    borderColor: colores.error,
  },
  bloqueGuardar: {
    gap: 10,
  },
  mensajeError: {
    color: colores.error,
    fontSize: 15,
  },
  textoSuave: {
    fontSize: 18,
    color: colores.textoSuave,
  },
});

export default Precios;
