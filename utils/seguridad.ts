import * as Crypto from "expo-crypto";

// Convierte una contraseña en un hash SHA-256, usando el nombre de usuario
// como sal. Asi nunca se guarda la contraseña real en la base de datos.
export const calcularHash = async (
  nombreUsuario: string,
  contrasena: string
): Promise<string> => {
  const textoConSal = `${nombreUsuario.trim().toLowerCase()}:${contrasena}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    textoConSal
  );
};

export default calcularHash;
