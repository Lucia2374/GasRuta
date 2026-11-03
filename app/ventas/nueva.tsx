import Boton from "@/components/boton";
import Campo from "@/components/campo";
import Chip from "@/components/chip";
import SelectorCliente from "@/components/selector-cliente";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import type { Cliente } from "@/database/clientes";
import { consultarPrecio, listarPesos, type Peso } from "@/database/precios";
import { registrarPrestamo } from "@/database/prestamos";
import { registrarVenta } from "@/database/ventas";
import { useSesion } from "@/hooks/use-sesion";
import { formatoPesos, textoANumero } from "@/utils/formato";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

type Paso = 1 | 2 | 3;

const PASOS: { numero: Paso; texto: string }[] = [
  { numero: 1, texto: "Cliente" },
  { numero: 2, texto: "Cilindro" },
  { numero: 3, texto: "Confirmar" },
];

// Registrar una venta en 3 pasos: elegir cliente, elegir cilindro y
// confirmar (con descuento y prestamo opcionales).
const NuevaVenta = () => {
  const db = useSQLiteContext();
  const { sesion } = useSesion();

  const [paso, setPaso] = useState<Paso>(1);

  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [pesos, setPesos] = useState<Peso[]>([]);
  const [idPeso, setIdPeso] = useState<number | null>(null);

  const [precio, setPrecio] = useState<number | null>(null);
  const [buscandoPrecio, setBuscandoPrecio] = useState(false);

  const [conDescuento, setConDescuento] = useState(false);
  const [textoDescuento, setTextoDescuento] = useState("");
  const [errorDescuento, setErrorDescuento] = useState("");

  const [conPrestamo, setConPrestamo] = useState(false);

  const [confirmando, setConfirmando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState("");

  useEffect(() => {
    listarPesos(db).then(setPesos);
  }, [db]);

  // El precio se busca solo cuando ya hay cliente y cilindro elegidos,
  // segun el tipo de cliente (Hogar o Negocio).
  useEffect(() => {
    if (!cliente || idPeso === null) {
      setPrecio(null);
      return;
    }

    const buscarPrecio = async () => {
      setBuscandoPrecio(true);
      const valor = await consultarPrecio(db, idPeso, cliente.id_tipo_cliente);
      setPrecio(valor);
      setBuscandoPrecio(false);
    };

    buscarPrecio();
  }, [db, cliente, idPeso]);

  const pesoElegido = pesos.find((p) => p.id_peso === idPeso) ?? null;

  const descuentoVistaPrevia = conDescuento ? textoANumero(textoDescuento) : 0;
  const totalVistaPrevia =
    precio !== null ? Math.max(0, precio - descuentoVistaPrevia) : 0;

  const avanzar = () => setPaso((p) => (p < 3 ? ((p + 1) as Paso) : p));
  const retroceder = () => setPaso((p) => (p > 1 ? ((p - 1) as Paso) : p));

  const manejarConfirmar = async () => {
    if (!cliente || idPeso === null || precio === null || !sesion) {
      return;
    }

    setErrorDescuento("");
    setErrorConfirmar("");

    const descuentoFinal = conDescuento ? textoANumero(textoDescuento) : 0;
    if (conDescuento && !(descuentoFinal > 0 && descuentoFinal < precio)) {
      setErrorDescuento("El descuento debe ser mayor que 0 y menor que el precio.");
      return;
    }

    setConfirmando(true);
    try {
      const idVenta = await registrarVenta(db, {
        idCliente: cliente.id_cliente,
        idPeso,
        idUsuario: sesion.id_usuario,
        precioAplicado: precio,
        descuento: descuentoFinal,
      });

      if (conPrestamo) {
        await registrarPrestamo(db, {
          idCliente: cliente.id_cliente,
          idPeso,
          idUsuario: sesion.id_usuario,
        });
      }

      router.replace({
        pathname: "/ventas/[venta_id]",
        params: { venta_id: String(idVenta), conPrestamo: conPrestamo ? "1" : "0" },
      });
    } catch (error) {
      setErrorConfirmar(
        error instanceof Error ? error.message : "No se pudo registrar la venta."
      );
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <View style={style.contenedor}>
      <View style={style.indicadorPasos}>
        {PASOS.map((item) => {
          const completado = item.numero <= paso;
          return (
            <View key={item.numero} style={style.pasoItem}>
              <View style={[style.circuloPaso, completado && style.circuloPasoActivo]}>
                <Text
                  style={[style.numeroPaso, completado && style.numeroPasoActivo]}
                >
                  {item.numero}
                </Text>
              </View>
              <Text style={style.textoPaso}>{item.texto}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={style.contenido}>
        {paso === 1 && (
          <>
            <Text style={style.tituloPaso}>Elige el cliente</Text>
            <SelectorCliente onSeleccionar={setCliente} />
          </>
        )}

        {paso === 2 && (
          <>
            <Text style={style.tituloPaso}>Elige el cilindro</Text>
            <View style={style.filaChips}>
              {pesos.map((peso) => (
                <Chip
                  key={peso.id_peso}
                  texto={peso.descripcion}
                  seleccionado={idPeso === peso.id_peso}
                  onPress={() => setIdPeso(peso.id_peso)}
                />
              ))}
            </View>
            {idPeso !== null && !buscandoPrecio && precio === null && (
              <Text style={style.mensajeError}>
                No hay un precio configurado para este cilindro con este tipo de
                cliente. Pide al titular que lo configure en Precios.
              </Text>
            )}
          </>
        )}

        {paso === 3 && cliente && pesoElegido && precio !== null && (
          <>
            <Text style={style.tituloPaso}>Confirmar venta</Text>

            <Tarjeta estilo={style.resumen}>
              <Text style={style.filaResumen}>Cliente: {cliente.nombre}</Text>
              <Text style={style.filaResumen}>Cilindro: {pesoElegido.descripcion}</Text>
              <Text style={style.precioGrande}>{formatoPesos(precio)}</Text>
            </Tarjeta>

            <View style={style.filaSwitch}>
              <Text style={style.etiquetaSwitch}>¿Descuento?</Text>
              <Switch
                value={conDescuento}
                onValueChange={(valor) => {
                  setConDescuento(valor);
                  if (!valor) {
                    setTextoDescuento("");
                    setErrorDescuento("");
                  }
                }}
                trackColor={{ false: colores.borde, true: colores.primario }}
                thumbColor={colores.blanco}
              />
            </View>

            {conDescuento && (
              <Campo
                etiqueta="Valor del descuento"
                valor={textoDescuento}
                onCambiar={setTextoDescuento}
                teclado="numeric"
                marcarError={errorDescuento.length > 0}
              />
            )}
            {errorDescuento.length > 0 && (
              <Text style={style.mensajeError}>{errorDescuento}</Text>
            )}

            <View style={style.filaSwitch}>
              <Text style={style.etiquetaSwitch}>¿Deja el cilindro en préstamo?</Text>
              <Switch
                value={conPrestamo}
                onValueChange={setConPrestamo}
                trackColor={{ false: colores.borde, true: colores.primario }}
                thumbColor={colores.blanco}
              />
            </View>

            <Tarjeta estilo={style.tarjetaTotal}>
              <Text style={style.etiquetaTotal}>Total</Text>
              <Text style={style.totalGrande}>{formatoPesos(totalVistaPrevia)}</Text>
            </Tarjeta>

            {errorConfirmar.length > 0 && (
              <Text style={style.mensajeError}>{errorConfirmar}</Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={style.filaBotones}>
        <Boton
          texto={paso === 1 ? "Cancelar" : "Atrás"}
          variante="secundario"
          onPress={paso === 1 ? () => router.back() : retroceder}
        />
        {paso < 3 ? (
          <Boton
            texto="Siguiente"
            onPress={avanzar}
            deshabilitado={
              (paso === 1 && !cliente) || (paso === 2 && (idPeso === null || precio === null))
            }
          />
        ) : (
          <Boton
            texto={confirmando ? "Guardando..." : "Confirmar venta"}
            onPress={manejarConfirmar}
            deshabilitado={confirmando}
          />
        )}
      </View>
    </View>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  indicadorPasos: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    backgroundColor: colores.primarioOscuro,
    paddingVertical: 16,
  },
  pasoItem: {
    alignItems: "center",
    gap: 6,
  },
  circuloPaso: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  circuloPasoActivo: {
    backgroundColor: colores.acento,
    borderColor: colores.acento,
  },
  numeroPaso: {
    fontSize: 14,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.6)",
  },
  numeroPasoActivo: {
    color: colores.primarioOscuro,
  },
  textoPaso: {
    fontSize: 12,
    fontWeight: "600",
    color: colores.blanco,
  },
  contenido: {
    padding: 20,
    gap: 14,
  },
  tituloPaso: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.texto,
  },
  filaChips: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  resumen: {
    gap: 4,
  },
  filaResumen: {
    fontSize: 16,
    color: colores.texto,
  },
  precioGrande: {
    fontSize: 28,
    fontWeight: "bold",
    color: colores.primario,
    marginTop: 6,
  },
  filaSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.vidrioBorde,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  etiquetaSwitch: {
    fontSize: 16,
    color: colores.texto,
    flex: 1,
    marginRight: 10,
  },
  tarjetaTotal: {
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  etiquetaTotal: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.textoSuave,
  },
  totalGrande: {
    fontSize: 34,
    fontWeight: "bold",
    color: colores.primario,
  },
  mensajeError: {
    color: colores.error,
    fontSize: 15,
  },
  filaBotones: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: colores.fondo,
  },
});

export default NuevaVenta;
