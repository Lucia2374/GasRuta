import Boton from "@/components/boton";
import Campo from "@/components/campo";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { useSesion } from "@/hooks/use-sesion";
import { crearUsuario, listarUsuarios, type Usuario } from "@/database/usuarios";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

// Pantalla solo para el titular: ve las cuentas que existen y puede crear
// la cuenta del asistente (solo se permiten 2 cuentas en total).
const Usuarios = () => {
  const db = useSQLiteContext();
  const { sesion, cargando } = useSesion();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [errores, setErrores] = useState({
    nombre: false,
    usuario: false,
    contrasena: false,
    confirmar: false,
  });
  const [mensajeError, setMensajeError] = useState("");
  const [creando, setCreando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    const lista = await listarUsuarios(db);
    setUsuarios(lista);
  }, [db]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    // Si un asistente llega a esta pantalla (por ejemplo escribiendo la ruta
    // a mano), se le devuelve al inicio: esto es solo para el titular.
    if (!cargando && sesion && sesion.rol !== "TITULAR") {
      router.replace("/inicio");
    }
  }, [cargando, sesion]);

  const manejarCrearAsistente = async () => {
    const sinNombre = nombre.trim().length === 0;
    const sinUsuario = nombreUsuario.trim().length === 0;
    const contrasenaCorta = contrasena.length < 6;
    const noCoincide = contrasena !== confirmarContrasena;

    setErrores({
      nombre: sinNombre,
      usuario: sinUsuario,
      contrasena: contrasenaCorta,
      confirmar: noCoincide,
    });

    if (sinNombre || sinUsuario || contrasenaCorta || noCoincide) {
      setMensajeError(
        noCoincide && !contrasenaCorta
          ? "Las contraseñas no coinciden."
          : "Revisa los campos marcados en rojo."
      );
      return;
    }

    setMensajeError("");
    setCreando(true);
    try {
      await crearUsuario(db, { nombre, nombreUsuario, contrasena });
      setNombre("");
      setNombreUsuario("");
      setContrasena("");
      setConfirmarContrasena("");
      await cargarUsuarios();
    } catch (error) {
      setMensajeError(
        error instanceof Error ? error.message : "No se pudo crear la cuenta."
      );
    } finally {
      setCreando(false);
    }
  };

  if (cargando || !sesion) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>Cargando...</Text>
      </View>
    );
  }

  const quedaCupo = usuarios.length < 2;

  return (
    <FlatList
      style={style.contenedor}
      contentContainerStyle={style.contenido}
      data={usuarios}
      keyExtractor={(item) => String(item.id_usuario)}
      renderItem={({ item }) => (
        <View style={style.fila}>
          <View style={style.filaTexto}>
            <Text style={style.filaNombre}>{item.nombre}</Text>
            <Text style={style.filaDetalle}>{item.nombre_usuario}</Text>
          </View>
          <View
            style={[
              style.etiquetaRol,
              item.rol === "TITULAR" ? style.etiquetaTitular : style.etiquetaAsistente,
            ]}
          >
            <Text style={style.etiquetaRolTexto}>
              {item.rol === "TITULAR" ? "Titular" : "Asistente"}
            </Text>
          </View>
        </View>
      )}
      ListHeaderComponent={<Text style={style.titulo}>Cuentas</Text>}
      ListFooterComponent={
        <View style={style.bloqueFormulario}>
          {quedaCupo ? (
            <Tarjeta estilo={style.tarjetaFormulario}>
              <Text style={style.subtitulo}>Crear cuenta del asistente</Text>
              <Campo
                etiqueta="Nombre completo"
                valor={nombre}
                onCambiar={setNombre}
                marcarError={errores.nombre}
                capitalizar="words"
              />
              <Campo
                etiqueta="Nombre de usuario"
                valor={nombreUsuario}
                onCambiar={setNombreUsuario}
                marcarError={errores.usuario}
              />
              <Campo
                etiqueta="Contraseña (mínimo 6 caracteres)"
                valor={contrasena}
                onCambiar={setContrasena}
                marcarError={errores.contrasena}
                esContrasena
              />
              <Campo
                etiqueta="Confirmar contraseña"
                valor={confirmarContrasena}
                onCambiar={setConfirmarContrasena}
                marcarError={errores.confirmar}
                esContrasena
              />

              {mensajeError.length > 0 && (
                <Text style={style.mensajeError}>{mensajeError}</Text>
              )}

              <Boton
                texto={creando ? "Creando cuenta..." : "Crear cuenta del asistente"}
                onPress={manejarCrearAsistente}
                deshabilitado={creando}
              />
            </Tarjeta>
          ) : (
            <Text style={style.subtitulo}>
              Ya existen las 2 cuentas permitidas (titular y asistente).
            </Text>
          )}
        </View>
      }
    />
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
    gap: 12,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colores.texto,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.vidrioBorde,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  filaTexto: {
    gap: 2,
  },
  filaNombre: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.texto,
  },
  filaDetalle: {
    fontSize: 14,
    color: colores.textoSuave,
  },
  etiquetaRol: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  etiquetaTitular: {
    backgroundColor: colores.primarioClaro,
  },
  etiquetaAsistente: {
    backgroundColor: colores.negocio,
  },
  etiquetaRolTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.primarioOscuro,
  },
  bloqueFormulario: {
    gap: 14,
    marginTop: 16,
  },
  tarjetaFormulario: {
    gap: 14,
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

export default Usuarios;
