import { colores } from "@/constants/colores";
import { inicializarBD } from "@/database/db";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

// Layout principal de la app.
// Abre la base de datos local una sola vez y la comparte con todas las pantallas.
const LayoutPrincipal = () => {
  return (
    <SQLiteProvider databaseName="gasruta.db" onInit={inicializarBD}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.primarioOscuro },
          headerTintColor: colores.blanco,
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="inicio" options={{ headerShown: false }} />
        <Stack.Screen name="usuarios" options={{ title: "Usuarios" }} />
        <Stack.Screen name="precios" options={{ title: "Precios" }} />
        <Stack.Screen name="clientes/index" options={{ title: "Clientes" }} />
        <Stack.Screen name="clientes/nuevo" options={{ title: "Nuevo cliente" }} />
        <Stack.Screen name="clientes/[cliente_id]" options={{ title: "Editar cliente" }} />
        <Stack.Screen name="ventas/nueva" options={{ title: "Nueva venta" }} />
        <Stack.Screen
          name="ventas/[venta_id]"
          options={{ title: "Venta registrada", headerBackVisible: false }}
        />
        <Stack.Screen name="prestamos/index" options={{ title: "Préstamos" }} />
        <Stack.Screen name="prestamos/nuevo" options={{ title: "Nuevo préstamo" }} />
        <Stack.Screen name="resumen" options={{ title: "Resumen del día" }} />
      </Stack>
    </SQLiteProvider>
  );
};

export default LayoutPrincipal;
