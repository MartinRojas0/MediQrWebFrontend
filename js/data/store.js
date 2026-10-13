// ==========================================================
// MediQR · Estado de la aplicacion
//
// Une los datos ficticios, el estado en memoria y los metodos de cada
// modulo en un unico objeto: MediModules.
//
// Object.assign conserva 'this.' dentro de los metodos sin reescribirlos.
// Cuando se conecte el backend, este archivo es la unica capa que habra
// que sustituir por un cliente de API.
// ==========================================================
(function (global) {
  "use strict";

  var MediModules = {
    /* ------------------------------------------------------
       DATOS FICTICIOS
       Unica fuente de datos del portal mientras no haya backend.
    ------------------------------------------------------ */
    lugares: {
      "Clínica Dental MediQR": "Av. Javier Prado Este 1234, San Borja",
      "Clínica MediSalud": "Av. Arequipa 2450, Lince",
      "Centro Médico San Miguel": "Av. La Marina 2230, San Miguel",
      "Hospital Central MediQR": "Av. Salaverry 3100, Jesús María"
    },

    medicos: {
      "Medicina General": ["Dra. Ana Martínez", "Dr. Luis Torres"],
      "Odontología": ["Dr. Carlos Pérez", "Dra. Rosa Quispe"],
      "Cardiología": ["Dra. Lucía Ramos", "Dr. Jorge Salazar"],
      "Dermatología": ["Dr. Diego Flores"],
      "Oftalmología": ["Dra. Patricia Vega"],
      "Pediatría": ["Dr. Mateo Rojas"]
    },

    // "desp" = dias de diferencia respecto a hoy (se convierte en fecha real)
    citas: [
      { id: 1, especialidad: "Odontología", medico: "Dr. Carlos Pérez", desp: 2, hora: "10:30", lugar: "Clínica Dental MediQR", estado: "Próxima", motivo: "Limpieza dental y control de caries." },
      { id: 2, especialidad: "Cardiología", medico: "Dra. Lucía Ramos", desp: 7, hora: "15:00", lugar: "Centro Médico San Miguel", estado: "Próxima", motivo: "Control de presión arterial." },
      { id: 3, especialidad: "Medicina General", medico: "Dra. Ana Martínez", desp: -14, hora: "09:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Malestar general y congestión nasal." },
      { id: 4, especialidad: "Odontología", medico: "Dr. Carlos Pérez", desp: -20, hora: "11:00", lugar: "Clínica Dental MediQR", estado: "Atendida", motivo: "Dolor en una muela." },
      { id: 5, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: -5, hora: "16:00", lugar: "Clínica MediSalud", estado: "Cancelada", motivo: "" },
      { id: 6, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: -45, hora: "10:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Revisión de alergia en la piel." },
      { id: 7, especialidad: "Cardiología", medico: "Dra. Lucía Ramos", desp: -60, hora: "08:30", lugar: "Centro Médico San Miguel", estado: "Atendida", motivo: "Chequeo cardiológico anual." },
      { id: 8, especialidad: "Medicina General", medico: "Dr. Luis Torres", desp: 0, hora: "16:00", lugar: "Clínica MediSalud", estado: "Próxima", motivo: "Control de rutina." },
      { id: 9, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: 7, hora: "09:00", lugar: "Clínica MediSalud", estado: "Próxima", motivo: "" }
    ],

    documentos: [
      { id: 1, nombre: "Receta_consulta_general.pdf", tipo: "Receta", citaId: 3 },
      { id: 2, nombre: "Hemograma_completo.pdf", tipo: "Examen", subtipo: "Análisis de laboratorio", citaId: 3 },
      { id: 3, nombre: "Informe_control_medico.pdf", tipo: "Informe", citaId: 3 },
      { id: 4, nombre: "Constancia_atencion.pdf", tipo: "Otro", subtipo: "Constancia", citaId: 3 },
      { id: 5, nombre: "Radiografia_dental.jpg", tipo: "Examen", subtipo: "Radiografía", citaId: 4 },
      { id: 6, nombre: "Receta_dermatologia.pdf", tipo: "Receta", citaId: 6 },
      { id: 7, nombre: "Informe_cardiologico.pdf", tipo: "Informe", citaId: 7 },
      { id: 8, nombre: "Electrocardiograma.png", tipo: "Examen", subtipo: "Imágenes médicas", citaId: 7 },
      { id: 9, nombre: "Comprobante_seguro.pdf", tipo: "Otro", subtipo: "Seguro médico", citaId: null, desp: -30 }
    ],

    vistasDoc: {
      Todos: { tipo: null, titulo: "Mis documentos", subtitulo: "Tus recetas, exámenes e informes en un solo lugar." },
      Recetas: { tipo: "Receta", titulo: "Recetas médicas", subtitulo: "Recetas indicadas por tus médicos." },
      "Exámenes": { tipo: "Examen", titulo: "Exámenes médicos", subtitulo: "Análisis de laboratorio, radiografías, imágenes y resultados." },
      Informes: { tipo: "Informe", titulo: "Informes médicos", subtitulo: "Informes emitidos después de tus consultas." },
      Otros: { tipo: "Otro", titulo: "Otros documentos", subtitulo: "Documentos que no son recetas, exámenes ni informes." }
    },

    /* ------------------------------------------------------
       ESTADO EN MEMORIA
       Se pierde al recargar: es una demostracion con datos
       simulados, todavia no hay persistencia.
    ------------------------------------------------------ */
    pestaña: "calendario",
    docVista: "Todos",
    mes: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    diaSeleccionado: "",
    borrador: null,
    citaPendiente: null,
    temporizadorAviso: null,

    // Los "desp" son relativos a hoy: se resuelven una sola vez al arrancar.
    resolverFechas() {
      const hoy = new Date();

      this.citas.forEach((cita) => {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() + cita.desp);
        cita.fecha = this.fechaISO(fecha);
        cita.direccion = this.lugares[cita.lugar];
        delete cita.desp;
      });

      this.documentos.forEach((doc) => {
        const cita = this.citas.find((c) => c.id === doc.citaId);

        if (cita) {
          doc.fecha = cita.fecha;
        } else {
          const fecha = new Date(hoy);
          fecha.setDate(fecha.getDate() + doc.desp);
          doc.fecha = this.fechaISO(fecha);
        }

        delete doc.desp;
      });

      this.diaSeleccionado = this.fechaISO(hoy);
      this.borrador = this.nuevoBorrador();
    }
  };

  // Recompone los metodos de cada modulo sobre el mismo objeto, de modo que
  // 'this.' dentro de ellos sigue apuntando a MediModules.
  const partes = global.MediPartes || {};

  Object.assign(
    MediModules,
    partes.fechas,
    partes.dom,
    partes.formato,
    partes.navbar,
    partes.modal,
    partes.citas,
    partes.documentos
  );

  global.MediModules = MediModules;
})(window);