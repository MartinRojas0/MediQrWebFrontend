// ==========================================================
// MediQR · Estado de la aplicacion
//
// Une los datos de demostración, el estado de sesión y los metodos de cada
// modulo en un unico objeto: MediModules. El perfil y el historial del usuario
// autenticado se sustituyen con los datos recuperados desde la API.
//
// Object.assign conserva 'this.' dentro de los metodos sin reescribirlos.
// Cuando se conecte el backend, este archivo es la unica capa que habra
// que sustituir por un cliente de API.
// ==========================================================
(function (global) {
  "use strict";

  var MediModules = {
    /* ------------------------------------------------------
       DATOS DE DEMOSTRACION
       Los modulos sin integración propia siguen usando estos datos.
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

    /* ------------------------------------------------------
       EXPEDIENTE CLINICO
       Fuente de verdad: FragmentoSalud.java y models/
       HistorialMedico.kt de la app movil. Alli las alergias,
       condiciones, medicamentos, vacunas y cirugias son
       estructuras, no texto suelto como estaban aqui.
    ------------------------------------------------------ */
    // Fuente unica de la identidad del paciente.
    //
    // Antes el nombre vivia escrito en el marcado de Inicio ("Hola,
    // Paciente Demo") y aparte en el de Perfil ("Delegada / Demo"): dos
    // valores distintos que editando uno no cambiaba el otro. Ahora
    // ambas vistas leen de aqui, asi que guardar en Perfil se refleja en
    // todo el portal y el onboarding escribe en el mismo sitio.
    paciente: {
      nombre: "Martin",
      apellidos: "",
      nacimiento: "1990-01-01",
      dni: "00000000",
      email: "paciente.demo@ejemplo.invalid",
      telefono: "+51 000 000 000",
      calle: "",
      distrito: ""
    },
    salud: {
      tipoSangre: "O+",

      alergias: [
        { nombre: "Penicilina", severidad: "grave" },
        { nombre: "Aspirina", severidad: "leve" }
      ],

      condicionesCronicas: [
        { nombre: "Hipertensión leve", diagnostico: "TA 140/90 en consulta", fechaDiagnostico: "2024-03-12" }
      ],

      medicamentosActuales: [
        { nombre: "Paracetamol", dosis: "500 mg", frecuencia: "Cada 8 horas", fechaInicio: "2026-08-10", fechaFin: null }
      ],

      vacunas: [
        { nombre: "Influenza", fechaAplicacion: "2025-04-20", dosis: 1 }
      ],

cirugias: [
            { nombre: "Extracción dental", fecha: "2025-11-05", hospital: "Clínica MediSalud" }
          ],
          // Contactos de emergencia. Se guardan de verdad, como el resto del
          // expediente: viven en memoria y se pierden al recargar, que es lo
          // que el aviso deja claro despues de cada cambio.
          contactos: [
            { id: 1, nombre: "Contacto Demo", parentesco: "Hermana", telefono: "+51 000 000 001" }
          ]
        },

    vistasDoc: {
      Todos: { tipo: null, titulo: "Mis documentos", subtitulo: "Tus recetas, exámenes e informes en un solo lugar." },
      Recetas: { tipo: "Receta", titulo: "Recetas médicas", subtitulo: "Recetas indicadas por tus médicos." },
      "Exámenes": { tipo: "Examen", titulo: "Exámenes médicos", subtitulo: "Análisis de laboratorio, radiografías, imágenes y resultados." },
      Informes: { tipo: "Informe", titulo: "Informes médicos", subtitulo: "Informes emitidos después de tus consultas." },
      Otros: { tipo: "Otro", titulo: "Otros documentos", subtitulo: "Documentos que no son recetas, exámenes ni informes." }
    },

    /* ------------------------------------------------------
       ESTADO EN MEMORIA
       Estado efimero de la interfaz; no se usa como sustituto de la
       persistencia del perfil e historial sincronizados desde la API.
    ------------------------------------------------------ */
    pestaña: "calendario",
    docVista: "Todos",
    mes: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    diaSeleccionado: "",
    historialClinico: null,
    configuracionInicialCompleta: false,
    borrador: null,
    citaPendiente: null,
    temporizadorAviso: null,
    citasServidorToken: null,
    citasServidorCargadas: false,
    citasServidorCargando: false,
    profesionalesServidor: [],
    profesionalesServidorToken: null,
    profesionalesServidorCargados: false,
    profesionalesServidorCargando: false,
    citaServidorGuardando: false,
    documentosServidor: [],
    documentosServidorToken: null,
    documentosServidorCargados: false,
    documentosServidorCargando: false,
    documentoPreviewUrl: null,

    aplicarHistorialServidor(historial) {
      this.historialClinico = historial || null;
      this.salud.tipoSangre = historial && historial.tipoSangre || "";

      const lista = (valor) => String(valor || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      this.salud.alergias = lista(historial && historial.alergias).map((item) => {
        const coincidencia = /^(.*?)\s*\((leve|moderada|grave)\)\s*$/i.exec(item);
        return coincidencia
          ? { nombre: coincidencia[1].trim(), severidad: coincidencia[2].toLowerCase() }
          : { nombre: item, severidad: "moderada" };
      });
      this.salud.condicionesCronicas = lista(historial && historial.enfermedadesCronicas)
        .map((nombre) => ({ nombre: nombre, diagnostico: "", fechaDiagnostico: "" }));
      this.salud.cirugias = lista(historial && historial.cirugias)
        .map((nombre) => ({ nombre: nombre, fecha: "", hospital: "" }));
    },

    async guardarHistorialServidor(cambios) {
      const api = window.MediApi;
      if (!api || !api.storage.getToken()) {
        throw new Error("No hay una sesión conectada a la API.");
      }

      let actual = this.historialClinico;
      if (!actual) {
        actual = await api.historial.getMe().catch((error) => {
          if (error && error.status === 404) return null;
          throw error;
        });
      }

      const payload = {
        tipoSangre: actual && actual.tipoSangre || "",
        alergias: actual && actual.alergias || "",
        enfermedadesCronicas: actual && actual.enfermedadesCronicas || "",
        cirugias: actual && actual.cirugias || "",
        observaciones: actual && actual.observaciones || ""
      };
      Object.assign(payload, cambios || {});

      const guardado = await api.historial.updateMe(payload);
      if (!guardado) {
        throw new Error("El servidor no devolvió el historial actualizado.");
      }

      const confirmado = await api.historial.getMe();
      if (!confirmado) {
        throw new Error("No se pudo volver a leer el historial desde el servidor.");
      }

      this.aplicarHistorialServidor(confirmado);
      if (window.SaludModulo && typeof window.SaludModulo.refrescar === "function") {
        window.SaludModulo.refrescar();
      }
      if (window.PerfilModulo && typeof window.PerfilModulo.refrescar === "function") {
        window.PerfilModulo.refrescar();
      }
      return confirmado;
    },

    // Sincronización asíncrona con el backend MediQR
    async cargarDatosServidor() {
      const api = window.MediApi;
      const token = api && api.storage.getToken();
      this.limpiarEstadoSesion(false);
      if (!api || !token || token !== api.storage.getToken()) return false;

      try {
        const usuario = api.storage.getUser();
        if (!usuario) return false;

        this.paciente.email = usuario.email || "";

        // 1. Obtener únicamente el perfil asociado al usuario autenticado.
        // El backend deriva el usuario desde el JWT; no se listan otros pacientes.
        const pacActual = await api.pacientes.getMe().catch((error) => {
          if (error && error.status === 404) return null;
          throw error;
        });
        if (token !== api.storage.getToken()) return false;

        let historial = null;
        if (pacActual) {
          this.paciente.id = pacActual.id || null;
          this.paciente.nombre = pacActual.nombres || "";
          this.paciente.apellidos = pacActual.apellidos || "";
          this.paciente.nacimiento = pacActual.fechaNacimiento || "";
          this.paciente.dni = pacActual.documentoIdentidad || "";
          this.paciente.telefono = pacActual.telefono || "";
          this.paciente.calle = pacActual.direccion || "";
          this.paciente.sexo = pacActual.sexo || "";
          this.paciente.email = usuario.email || this.paciente.email;

          // 2. Patient-owned medical data and emergency contact.
          const resultados = await Promise.all([
            api.historial.getMe().catch((error) => {
              if (error && error.status === 404) return null;
              throw error;
            }),
            api.pacientes.getEmergencyContactMe().catch((error) => {
              if (error && error.status === 404) return null;
              throw error;
            }),
            usuario.rol === "PACIENTE" ? api.citas.listMine() : Promise.resolve([])
          ]);
          if (token !== api.storage.getToken()) return false;
          historial = resultados[0];
          const contacto = resultados[1];
          this.citas = (resultados[2] || []).map((cita) => this.citaDesdeServidor(cita));
          this.citasServidorToken = token;
          this.citasServidorCargadas = true;
          this.paciente.contactoEmergenciaNombre = contacto && contacto.nombre || "";
          this.paciente.contactoEmergenciaParentesco = contacto && contacto.parentesco || "";
          this.paciente.contactoEmergenciaTelefono = contacto && contacto.telefono || "";
          this.salud.contactos = contacto && contacto.nombre && contacto.telefono
            ? [{
                id: "servidor",
                nombre: contacto.nombre,
                parentesco: contacto.parentesco || "Contacto",
                telefono: contacto.telefono
              }]
            : [];
        }

        if (token !== api.storage.getToken()) return false;
        this.aplicarHistorialServidor(historial);
        this.configuracionInicialCompleta = Boolean(
          pacActual && historial && this.paciente.nombre && this.paciente.apellidos
        );

        if (window.MediRefrescarPaciente) window.MediRefrescarPaciente();
        if (window.SaludModulo && typeof window.SaludModulo.refrescar === "function") {
          window.SaludModulo.refrescar();
        }
        if (window.PerfilModulo && typeof window.PerfilModulo.refrescar === "function") {
          window.PerfilModulo.refrescar();
        }
      } catch (e) {
        if (token !== api.storage.getToken()) return false;
        console.warn("[MediQR] No se pudieron sincronizar datos del backend:", e);
        this.aviso("No se pudo recuperar tu perfil del servidor. Inténtalo nuevamente.");
        return false;
      }
      return Boolean(this.paciente.id);
    },

    // Los "desp" son relativos a hoy: se resuelven una sola vez al arrancar.
    //
    // Es idempotente a proposito. La cita se queda sin "desp" al resolverse, y
    // este metodo tambien lo llama el final de la configuracion inicial: sin
    // el guardia de abajo, esa segunda pasada sumaria undefined a la fecha y
    // todas las citas de ejemplo quedarian con fecha NaN-NaN-NaN.
    resolverFechas() {
      const hoy = new Date();

      this.citas.forEach((cita) => {
        if (typeof cita.desp !== "number") return;

        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() + cita.desp);
        // Los datos de ejemplo son relativos a hoy, asi que una cita "proxima"
        // puede caer en domingo cuando hoy es viernes. El portal declara que
        // no hay atencion los domingos, de modo que se pasa al lunes: si no,
        // el paciente ve una cita el dia que el propio portal dice cerrado.
        if (cita.desp > 0 && fecha.getDay() === 0) {
          fecha.setDate(fecha.getDate() + 1);
        }
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

  const DATOS_DEMO = JSON.parse(JSON.stringify({
    paciente: MediModules.paciente,
    salud: MediModules.salud,
    citas: MediModules.citas,
    documentos: MediModules.documentos
  }));

  const DEMO_PERSONAS = {
    pedro: {
      paciente: {
        nombre: "Pedro",
        apellidos: "Demo",
        nacimiento: "1988-05-12",
        dni: "00000001",
        email: "pedro.demo@ejemplo.invalid",
        telefono: "+51 000 000 101",
        calle: "Dirección ficticia 101",
        distrito: "Distrito Demo",
        sexo: "MASCULINO"
      },
      salud: {
        tipoSangre: "A+",
        alergias: [{ nombre: "Polen", severidad: "leve" }],
        condicionesCronicas: [{ nombre: "Asma leve", diagnostico: "Dato ficticio", fechaDiagnostico: "2023-02-10" }],
        medicamentosActuales: [{ nombre: "Inhalador de muestra", dosis: "1 dosis", frecuencia: "Según indicación ficticia", fechaInicio: "2026-01-10", fechaFin: null }],
        vacunas: [{ nombre: "Influenza (muestra)", fechaAplicacion: "2025-04-20", dosis: 1 }],
        cirugias: [],
        contactos: [{ id: 101, nombre: "Contacto Demo Pedro", parentesco: "Familiar ficticio", telefono: "+51 000 000 201" }]
      },
      citas: [
        { id: 101, especialidad: "Medicina General", medico: "Dra. Ana Martínez", desp: -12, hora: "09:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Control preventivo ficticio." },
        { id: 102, especialidad: "Cardiología", medico: "Dra. Lucía Ramos", desp: 5, hora: "15:00", lugar: "Centro Médico San Miguel", estado: "Próxima", motivo: "Revisión de muestra." },
        { id: 103, especialidad: "Odontología", medico: "Dr. Carlos Pérez", desp: -30, hora: "10:30", lugar: "Clínica Dental MediQR", estado: "Atendida", motivo: "Consulta dental ficticia." }
      ],
      documentos: [
        { id: 101, nombre: "Receta_demo_pedro.pdf", tipo: "Receta", citaId: 101 },
        { id: 102, nombre: "Informe_demo_pedro.pdf", tipo: "Informe", citaId: 101 }
      ]
    },
    martin: {
      paciente: {
        nombre: "Martin",
        apellidos: "Demo",
        nacimiento: "1990-01-01",
        dni: "00000002",
        email: "martin.demo@ejemplo.invalid",
        telefono: "+51 000 000 102",
        calle: "Dirección ficticia 102",
        distrito: "Distrito Demo",
        sexo: "MASCULINO"
      },
      salud: {
        tipoSangre: "O+",
        alergias: [{ nombre: "Aspirina", severidad: "leve" }],
        condicionesCronicas: [{ nombre: "Hipertensión (muestra)", diagnostico: "Registro ficticio", fechaDiagnostico: "2024-03-12" }],
        medicamentosActuales: [{ nombre: "Medicamento de muestra", dosis: "500 mg", frecuencia: "Cada 8 horas (muestra)", fechaInicio: "2026-08-10", fechaFin: null }],
        vacunas: [{ nombre: "Influenza (muestra)", fechaAplicacion: "2025-04-20", dosis: 1 }],
        cirugias: [{ nombre: "Procedimiento ficticio", fecha: "2025-11-05", hospital: "Centro Demo" }],
        contactos: [{ id: 201, nombre: "Contacto Demo Martin", parentesco: "Familiar ficticio", telefono: "+51 000 000 202" }]
      },
      citas: [
        { id: 201, especialidad: "Medicina General", medico: "Dr. Luis Torres", desp: 0, hora: "16:00", lugar: "Clínica MediSalud", estado: "Próxima", motivo: "Control de rutina ficticio." },
        { id: 202, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: -14, hora: "10:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Consulta de muestra." },
        { id: 203, especialidad: "Odontología", medico: "Dra. Rosa Quispe", desp: -45, hora: "11:00", lugar: "Clínica Dental MediQR", estado: "Atendida", motivo: "Control dental ficticio." }
      ],
      documentos: [
        { id: 201, nombre: "Receta_demo_martin.pdf", tipo: "Receta", citaId: 202 },
        { id: 202, nombre: "Examen_demo_martin.pdf", tipo: "Examen", subtipo: "Muestra", citaId: 202 }
      ]
    },
    veronica: {
      paciente: {
        nombre: "Verónica",
        apellidos: "Demo",
        nacimiento: "1994-09-23",
        dni: "00000003",
        email: "veronica.demo@ejemplo.invalid",
        telefono: "+51 000 000 103",
        calle: "Dirección ficticia 103",
        distrito: "Distrito Demo",
        sexo: "FEMENINO"
      },
      salud: {
        tipoSangre: "AB+",
        alergias: [{ nombre: "Alimento de muestra", severidad: "moderada" }],
        condicionesCronicas: [{ nombre: "Migraña (muestra)", diagnostico: "Registro ficticio", fechaDiagnostico: "2022-06-18" }],
        medicamentosActuales: [{ nombre: "Tratamiento de muestra", dosis: "250 mg", frecuencia: "Una vez al día (muestra)", fechaInicio: "2026-02-01", fechaFin: null }],
        vacunas: [{ nombre: "Refuerzo (muestra)", fechaAplicacion: "2025-09-15", dosis: 1 }],
        cirugias: [],
        contactos: [{ id: 301, nombre: "Contacto Demo Verónica", parentesco: "Familiar ficticio", telefono: "+51 000 000 203" }]
      },
      citas: [
        { id: 301, especialidad: "Medicina General", medico: "Dra. Ana Martínez", desp: 3, hora: "09:30", lugar: "Clínica MediSalud", estado: "Próxima", motivo: "Seguimiento ficticio." },
        { id: 302, especialidad: "Cardiología", medico: "Dr. Jorge Salazar", desp: -21, hora: "14:00", lugar: "Centro Médico San Miguel", estado: "Atendida", motivo: "Consulta de muestra." },
        { id: 303, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: -50, hora: "11:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Revisión ficticia." }
      ],
      documentos: [
        { id: 301, nombre: "Informe_demo_veronica.pdf", tipo: "Informe", citaId: 302 },
        { id: 302, nombre: "Examen_demo_veronica.pdf", tipo: "Examen", subtipo: "Muestra", citaId: 302 }
      ]
    }
  };

  MediModules.limpiarEstadoSesion = function (modoDemo, personaDemo) {
    if (this.temporizadorAviso) clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = null;

    if (modoDemo) {
      if (personaDemo && !DEMO_PERSONAS[personaDemo]) {
        throw new Error("No existe ese perfil de demostración.");
      }
      const datos = JSON.parse(JSON.stringify(personaDemo ? DEMO_PERSONAS[personaDemo] : DATOS_DEMO));
      this.paciente = datos.paciente;
      this.salud = datos.salud;
      this.citas = datos.citas;
      this.documentos = datos.documentos;
      this.demoPersona = personaDemo || "";
    } else {
      this.paciente = {
        id: null,
        nombre: "",
        apellidos: "",
        nacimiento: "",
        dni: "",
        email: "",
        telefono: "",
        calle: "",
        distrito: "",
        sexo: ""
      };
      this.salud = {
        tipoSangre: "",
        alergias: [],
        condicionesCronicas: [],
        medicamentosActuales: [],
        vacunas: [],
        cirugias: [],
        contactos: []
      };
      this.citas = [];
      this.documentos = [];
      this.demoPersona = "";
    }

    this.pestaña = "calendario";
    this.docVista = "Todos";
    this.mes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.historialClinico = null;
    this.configuracionInicialCompleta = Boolean(modoDemo);
    this.citaPendiente = null;
    this.citasServidorToken = null;
    this.citasServidorCargadas = false;
    this.citasServidorCargando = false;
    this.profesionalesServidor = [];
    this.profesionalesServidorToken = null;
    this.profesionalesServidorCargados = false;
    this.profesionalesServidorCargando = false;
    this.citaServidorGuardando = false;
    if (typeof this.liberarPreviewDocumento === "function") this.liberarPreviewDocumento();
    this.documentosServidor = [];
    this.documentosServidorToken = null;
    this.documentosServidorCargados = false;
    this.documentosServidorCargando = false;
    if (window.QrModulo && typeof window.QrModulo.limpiarSesion === "function") {
      window.QrModulo.limpiarSesion();
    }
    this.resolverFechas();

    if (typeof this.close === "function") this.close();
    if (typeof this.cerrarMenus === "function") this.cerrarMenus();
    if (window.MediNotifications) window.MediNotifications.clear();
    if (window.MediRefrescarPaciente) window.MediRefrescarPaciente();
    if (window.SaludModulo && typeof window.SaludModulo.refrescar === "function") {
      window.SaludModulo.refrescar();
    }
    if (window.PerfilModulo) {
      if (typeof window.PerfilModulo.resetEditForms === "function") {
        window.PerfilModulo.resetEditForms();
      }
      window.PerfilModulo.refrescar();
    }
    const historialView = document.getElementById("view-historial");
    if (historialView) historialView.dataset.renderizado = "";
    if (window.HistorialModulo) window.HistorialModulo.render();
    this.limpiarFiltrosDoc();
    this.render();
    this.documents();
  };

  global.MediModules = MediModules;

  // Las fechas de los datos ficticios se resuelven aqui y no en el arranque:
  // las vistas se dibujan en DOMContentLoaded y necesitan ".fecha ya
  // calculado para ordenar la proxima cita.
  MediModules.resolverFechas();
})(window);
