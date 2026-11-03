import Boton from "@/components/boton";
import Campo from "@/components/campo";
import FondoDegradado from "@/components/fondo-degradado";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { contarUsuarios, crearUsuario, validarCredenciales } from "@/database/usuarios";
import { guardarSesion, leerSesion } from "@/utils/sesion";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Estados posibles de esta pantalla: mientras se revisa si ya hay sesion o
// cuentas creadas, al crear la primera cuenta (titular) y al iniciar sesion.
type Modo = "cargando" | "crear_titular" | "iniciar_sesion";

// Pantalla de entrada de la app. Es la unica pantalla sin proteger por sesion,
// porque es ella la que crea o revisa la sesion.
const Index = () => {
  const db = useSQLiteContext();
  const [modo, setModo] = useState<Modo>("cargando");

  // Campos del formulario de inicio de sesion.
  const [usuarioLogin, setUsuarioLogin] = useState("");
  const [contrasenaLogin, setContrasenaLogin] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [enviandoLogin, setEnviandoLogin] = useState(false);

  // Campos del formulario de creacion del titular.
  const [nombre, setNombre] = useState("");
  const [usuarioNuevo, setUsuarioNuevo] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [erroresTitular, setErroresTitular] = useState({
    nombre: false,
    usuario: false,
    contrasena: false,
    confirmar: false,
  });
  const [errorTitular, setErrorTitular] = useState("");
  const [creandoTitular, setCreandoTitular] = useState(false);

  useEffect(() => {
    // Si ya hay una sesion guardada en el celular, se entra directo sin pedir nada.
    const verificarEstadoInicial = async () => {
      const sesionGuardada = await leerSesion();
      if (sesionGuardada) {
        router.replace("/inicio");
        return;
      }

      const total = await contarUsuarios(db);
      setModo(total === 0 ? "crear_titular" : "iniciar_sesion");
    };

    verificarEstadoInicial();
  }, [db]);

  const manejarCrearTitular = async () => {
    const sinNombre = nombre.trim().length === 0;
    const sinUsuario = usuarioNuevo.trim().length === 0;
    const contrasenaCorta = contrasenaNueva.length < 6;
    const noCoincide = contrasenaNueva !== confirmarContrasena;

    setErroresTitular({
      nombre: sinNombre,
      usuario: sinUsuario,
      contrasena: contrasenaCorta,
      confirmar: noCoincide,
    });

    if (sinNombre || sinUsuario || contrasenaCorta || noCoincide) {
      setErrorTitular(
        noCoincide && !contrasenaCorta
          ? "Las contraseñas no coinciden."
          : "Revisa los campos marcados en rojo."
      );
      return;
    }

    setErrorTitular("");
    setCreandoTitular(true);
    try {
      const usuarioCreado = await crearUsuario(db, {
        nombre,
        nombreUsuario: usuarioNuevo,
        contrasena: contrasenaNueva,
      });

      await guardarSesion({
        id_usuario: usuarioCreado.id_usuario,
        nombre: usuarioCreado.nombre,
        nombre_usuario: usuarioCreado.nombre_usuario,
        rol: usuarioCreado.rol,
      });

      router.replace("/inicio");
    } catch (error) {
      setErrorTitular(
        error instanceof Error ? error.message : "No se pudo crear la cuenta."
      );
    } finally {
      setCreandoTitular(false);
    }
  };

  const manejarIniciarSesion = async () => {
    if (usuarioLogin.trim().length === 0 || contrasenaLogin.length === 0) {
      setErrorLogin("Escribe tu usuario y tu contraseña.");
      return;
    }

    setErrorLogin("");
    setEnviandoLogin(true);
    try {
      const usuario = await validarCredenciales(db, usuarioLogin, contrasenaLogin);
      if (!usuario) {
        setErrorLogin("Usuario o contraseña incorrectos");
        return;
      }

      await guardarSesion({
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol,
      });

      router.replace("/inicio");
    } finally {
      setEnviandoLogin(false);
    }
  };

  if (modo === "cargando") {
    return (
      <FondoDegradado>
        <View style={style.contenedorCentrado}>
          <Text style={style.textoCargando}>Abriendo GasRuta...</Text>
        </View>
      </FondoDegradado>
    );
  }

  const esCrearTitular = modo === "crear_titular";

  return (
    <FondoDegradado>
      <ScrollView
        style={style.contenedor}
        contentContainerStyle={style.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={style.encabezado}>
          <View style={style.logo}>
            <Text style={style.logoIcono}>🔥</Text>
          </View>
          <Text style={style.titulo}>GasRuta</Text>
          <Text style={style.subtitulo}>Tus ventas de gas, siempre a mano</Text>
        </View>

        <Tarjeta estilo={style.tarjetaFormulario}>
          {esCrearTitular ? (
            <>
              <Text style={style.tituloTarjeta}>Crear cuenta del titular</Text>
              <Campo
                etiqueta="Nombre completo"
                valor={nombre}
                onCambiar={setNombre}
                marcarError={erroresTitular.nombre}
                capitalizar="words"
              />
              <Campo
                etiqueta="Nombre de usuario"
                valor={usuarioNuevo}
                onCambiar={setUsuarioNuevo}
                marcarError={erroresTitular.usuario}
              />
              <Campo
                etiqueta="Contraseña (mínimo 6 caracteres)"
                valor={contrasenaNueva}
                onCambiar={setContrasenaNueva}
                marcarError={erroresTitular.contrasena}
                esContrasena
              />
              <Campo
                etiqueta="Confirmar contraseña"
                valor={confirmarContrasena}
                onCambiar={setConfirmarContrasena}
                marcarError={erroresTitular.confirmar}
                esContrasena
              />

              {errorTitular.length > 0 && (
                <Text style={style.mensajeError}>{errorTitular}</Text>
              )}

              <Boton
                texto={creandoTitular ? "Creando cuenta..." : "Crear cuenta"}
                onPress={manejarCrearTitular}
                deshabilitado={creandoTitular}
              />
            </>
          ) : (
            <>
              <Text style={style.tituloTarjeta}>Ingresar</Text>
              <Campo etiqueta="Usuario" valor={usuarioLogin} onCambiar={setUsuarioLogin} />
              <Campo
                etiqueta="Contraseña"
                valor={contrasenaLogin}
                onCambiar={setContrasenaLogin}
                esContrasena
              />

              {errorLogin.length > 0 && (
                <Text style={style.mensajeError}>{errorLogin}</Text>
              )}

              <Boton
                texto={enviandoLogin ? "Ingresando..." : "Ingresar"}
                onPress={manejarIniciarSesion}
                deshabilitado={enviandoLogin}
              />
            </>
          )}
        </Tarjeta>

        <Text style={style.piePagina}>✓ Funciona sin internet</Text>
      </ScrollView>
    </FondoDegradado>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 70,
    gap: 24,
    justifyContent: "center",
  },
  contenedorCentrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textoCargando: {
    fontSize: 18,
    color: colores.blanco,
  },
  encabezado: {
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoIcono: {
    fontSize: 40,
  },
  titulo: {
    fontSize: 34,
    fontWeight: "bold",
    color: colores.blanco,
  },
  subtitulo: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
  },
  tarjetaFormulario: {
    gap: 16,
  },
  tituloTarjeta: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.texto,
  },
  mensajeError: {
    color: colores.error,
    fontSize: 15,
  },
  piePagina: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
});

export default Index;
