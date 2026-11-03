// Formatea un numero como pesos colombianos: 104000 -> "$ 104.000".
// Se hace a mano (sin Intl) para que funcione igual en cualquier celular,
// sin depender de que el equipo tenga los datos de idioma instalados.
export const formatoPesos = (valor: number): string => {
  const entero = Math.max(0, Math.round(valor));
  const texto = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$ ${texto}`;
};

// Convierte lo que el usuario escribio (puede traer puntos, comas o espacios)
// en un numero. Si no hay digitos devuelve 0.
export const textoANumero = (texto: string): number => {
  const limpio = texto.replace(/[^0-9]/g, "");
  if (limpio.length === 0) {
    return 0;
  }
  return Number(limpio);
};

// Formatea una fecha guardada como Date.now() al estilo dd/mm/aaaa.
export const formatoFecha = (fecha: number): string => {
  const fechaObjeto = new Date(fecha);
  const dia = String(fechaObjeto.getDate()).padStart(2, "0");
  const mes = String(fechaObjeto.getMonth() + 1).padStart(2, "0");
  const anio = fechaObjeto.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

// Cuantos dias completos han pasado desde una fecha guardada hasta ahora.
// Se usa para saber si un prestamo lleva muchos dias sin devolverse.
export const diasDesde = (fecha: number): number => {
  const unDiaEnMs = 24 * 60 * 60 * 1000;
  const diferencia = Date.now() - fecha;
  return Math.floor(diferencia / unDiaEnMs);
};
