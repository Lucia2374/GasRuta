import Boton from "@/components/boton";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { obtenerVenta, type VentaDetalle } from "@/database/ventas";
import { useSesion } from "@/hooks/use-sesion";
import { formatoPesos } from "@/utils/formato";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// Pantalla de confirmacion que aparece justo despues de registrar una venta.
// Se llega aqui con router.replace, asi que "Volver al inicio" puede usar
// router.back() sin pasar otra vez por esta pantalla.
const DetalleVenta = () => {
  const { venta_id, conPrestamo } = useLocalSearchParams<{
    venta_id: string;
    conPrestamo?: string;
  }>();
  const db = useSQLiteContext();
  useSesion();

  const [venta, setVenta] = useState<VentaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const datos = await obtenerVenta(db, Number(venta_id));
      setVenta(datos);
      setCargando(false);
    };

    cargar();
  }, [db, venta_id]);

  if (cargando) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>Cargando venta...</Text>
      </View>
    );
  }

  if (!venta) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>No se encontró la venta.</Text>
      </View>
    );
  }

  return (
    <View style={style.contenedor}>
      <View style={style.circuloExito}>
        <Text style={style.iconoExito}>✓</Text>
      </View>
      <Text style={style.tituloExito}>¡Venta guardada!</Text>

      <Tarjeta estilo={style.tarjeta}>
        <Text style={style.fila}>Cliente: {venta.nombre_cliente}</Text>
        <Text style={style.fila}>Vereda: {venta.direccion_vereda}</Text>
        <Text style={style.fila}>Cilindro: {venta.descripcion_peso}</Text>
        <Text style={style.fila}>Precio: {formatoPesos(venta.precio_aplicado)}</Text>
        {venta.descuento > 0 && (
          <Text style={style.fila}>Descuento: {formatoPesos(venta.descuento)}</Text>
        )}
        <Text style={style.totalGrande}>{formatoPesos(venta.total)}</Text>
      </Tarjeta>

      {conPrestamo === "1" && (
        <View style={style.aviso}>
          <Text style={style.avisoTexto}>También se registró el préstamo del cilindro.</Text>
        </View>
      )}

      <View style={style.botones}>
        <Boton texto="Registrar otra venta" onPress={() => router.replace("/ventas/nueva")} />
        <Boton
          texto="Volver al inicio"
          variante="secundario"
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
    padding: 20,
    gap: 16,
    alignItems: "center",
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  circuloExito: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colores.primarioClaro,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  iconoExito: {
    fontSize: 44,
    fontWeight: "bold",
    color: colores.primario,
  },
  tituloExito: {
    fontSize: 24,
    fontWeight: "bold",
    color: colores.texto,
    textAlign: "center",
  },
  tarjeta: {
    width: "100%",
    gap: 6,
  },
  fila: {
    fontSize: 16,
    color: colores.texto,
  },
  totalGrande: {
    fontSize: 28,
    fontWeight: "bold",
    color: colores.primario,
    marginTop: 8,
    textAlign: "center",
  },
  aviso: {
    width: "100%",
    backgroundColor: colores.primarioClaro,
    borderRadius: 16,
    padding: 12,
  },
  avisoTexto: {
    color: colores.primarioOscuro,
    fontWeight: "600",
    textAlign: "center",
  },
  botones: {
    width: "100%",
    gap: 12,
    marginTop: 10,
  },
  textoSuave: {
    fontSize: 18,
    color: colores.textoSuave,
  },
});

export default DetalleVenta;
