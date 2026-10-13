// ==========================================================
// MediQR · Validaciones
//
// Traduccion directa de utils/Validaciones.kt de la app movil. Los
// mensajes se conservan para que el usuario vea el mismo texto que en
// el telefono.
//
// Reglas del movil:
//   email      requerido y con formato valido
//   contrasena requerido, minimo 6, al menos un numero y una letra
//   confirmar  debe coincidir con la contrasena
//   dni        requerido y exactamente 8 digitos
//   telefono   requerido y exactamente 9 digitos
//   nombre     requerido y minimo 3 caracteres
//   nacimiento formato YYYY-MM-DD, no puede ser futuro, mayor de 18
//
// "Mayor de 18" es una condicion de negocio medica: un portal de
// pacientes no debe permitir dar de alta a menores sin supervision.
// ==========================================================
(function (global) {
  "use strict";

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const Validaciones = {
    email(valor) {
      if (!valor) return { ok: false, mensaje: "El email es requerido" };
      if (!EMAIL.test(valor)) return { ok: false, mensaje: "Email inválido" };
      return { ok: true };
    },

    contrasena(valor) {
      if (!valor) return { ok: false, mensaje: "La contraseña es requerida" };
      if (valor.length < 6) return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
      if (!/\d/.test(valor)) return { ok: false, mensaje: "La contraseña debe tener al menos un número" };
      if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(valor)) return { ok: false, mensaje: "La contraseña debe tener al menos una letra" };
      return { ok: true };
    },

    confirmar(contrasena, confirmacion) {
      if (contrasena !== confirmacion) return { ok: false, mensaje: "Las contraseñas no coinciden" };
      return { ok: true };
    },

    dni(valor) {
      if (!valor) return { ok: false, mensaje: "El DNI es requerido" };
      if (!/^[0-9]{8}$/.test(valor)) return { ok: false, mensaje: "DNI inválido (8 dígitos)" };
      return { ok: true };
    },

    telefono(valor) {
      if (!valor) return { ok: false, mensaje: "El teléfono es requerido" };
      if (!/^[0-9]{9}$/.test(valor)) return { ok: false, mensaje: "Teléfono inválido (9 dígitos)" };
      return { ok: true };
    },

    nombre(valor) {
      if (!valor) return { ok: false, mensaje: "El nombre es requerido" };
      if (valor.trim().length < 3) return { ok: false, mensaje: "El nombre debe tener al menos 3 caracteres" };
      return { ok: true };
    },

    // validarFechaNacimiento: sin futuro y mayor de edad.
    nacimiento(valor) {
      if (!valor) return { ok: false, mensaje: "La fecha de nacimiento es requerida" };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return { ok: false, mensaje: "Formato inválido (AAAA-MM-DD)" };

      const [anio, mes, dia] = valor.split("-").map(Number);
      const fecha = new Date(anio, mes - 1, dia);

      // Descarta fechas inexistentes como 2026-02-31.
      if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
        return { ok: false, mensaje: "Fecha inválida" };
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fecha > hoy) return { ok: false, mensaje: "La fecha no puede ser futura" };

      let edad = hoy.getFullYear() - fecha.getFullYear();
      const mesActual = hoy.getMonth();
      const diaActual = hoy.getDate();

      if (mesActual < fecha.getMonth() || (mesActual === fecha.getMonth() && diaActual < fecha.getDate())) {
        edad -= 1;
      }

      if (edad < 18) return { ok: false, mensaje: "Debes ser mayor de 18 años" };
      return { ok: true, edad: edad };
    },

    // Valida una lista de campos y devuelve el primer error.
    campos(objeto) {
      const nombres = Object.keys(objeto);
      for (let i = 0; i < nombres.length; i++) {
        const resultado = objeto[nombres[i]];
        if (!resultado.ok) return { ok: false, mensaje: "El campo " + nombres[i] + " es requerido" };
      }
      return { ok: true };
    },

    // Ejecuta una lista de reglas y devuelve el primer fallo.
    todo(reglas) {
      for (let i = 0; i < reglas.length; i++) {
        const resultado = reglas[i]();
        if (!resultado.ok) return resultado;
      }
      return { ok: true };
    }
  };

  global.MediValidaciones = Validaciones;
})(window);