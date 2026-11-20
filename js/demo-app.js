(function () {
  "use strict";

  const PERSONAS = {
    pedro: {
      label: "Pedro",
      profile: {
        firstName: "Pedro",
        lastName: "Demo",
        birthDate: "1988-05-12",
        email: "pedro.demo@ejemplo.invalid",
        phone: "+51 000 000 101",
        bloodType: "A+",
        district: "Distrito Demo 101"
      },
      appointments: [
        { date: "2026-11-25", time: "15:00", specialty: "Cardiología", provider: "Dra. Lucía Ramos", status: "Próxima", reason: "Revisión de muestra." },
        { date: "2026-10-12", time: "09:00", specialty: "Medicina General", provider: "Dra. Ana Martínez", status: "Atendida", reason: "Control preventivo ficticio." }
      ],
      consultations: [
        { date: "2026-10-12", specialty: "Medicina General", provider: "Dra. Ana Martínez", summary: "Consulta ficticia de control preventivo." }
      ],
      history: {
        allergies: ["Polen (leve, muestra)"],
        conditions: ["Asma leve (registro ficticio)"],
        vaccines: ["Influenza · 2025-04-20 (muestra)"],
        procedures: ["Sin procedimientos ficticios registrados."]
      },
      medications: [
        { name: "Inhalador de muestra", dose: "1 dosis", schedule: "Según indicación ficticia" }
      ],
      emergency: { contact: "Contacto Demo Pedro", relationship: "Familiar ficticio", phone: "+51 000 000 201" }
    },
    martin: {
      label: "Martin",
      profile: {
        firstName: "Martin",
        lastName: "Demo",
        birthDate: "1990-01-01",
        email: "martin.demo@ejemplo.invalid",
        phone: "+51 000 000 102",
        bloodType: "O+",
        district: "Distrito Demo 102"
      },
      appointments: [
        { date: "2026-11-20", time: "16:00", specialty: "Medicina General", provider: "Dr. Luis Torres", status: "Próxima", reason: "Control de rutina ficticio." },
        { date: "2026-11-06", time: "10:00", specialty: "Dermatología", provider: "Dr. Diego Flores", status: "Atendida", reason: "Consulta de muestra." }
      ],
      consultations: [
        { date: "2026-11-06", specialty: "Dermatología", provider: "Dr. Diego Flores", summary: "Consulta ficticia de seguimiento." },
        { date: "2026-09-18", specialty: "Odontología", provider: "Dra. Rosa Quispe", summary: "Revisión dental de muestra." }
      ],
      history: {
        allergies: ["Aspirina (leve, muestra)"],
        conditions: ["Hipertensión (registro ficticio)"],
        vaccines: ["Influenza · 2025-04-20 (muestra)"],
        procedures: ["Procedimiento ficticio · 2025-11-05"]
      },
      medications: [
        { name: "Medicamento de muestra", dose: "500 mg", schedule: "Cada 8 horas (muestra)" }
      ],
      emergency: { contact: "Contacto Demo Martin", relationship: "Familiar ficticio", phone: "+51 000 000 202" }
    },
    veronica: {
      label: "Verónica",
      profile: {
        firstName: "Verónica",
        lastName: "Demo",
        birthDate: "1994-09-23",
        email: "veronica.demo@ejemplo.invalid",
        phone: "+51 000 000 103",
        bloodType: "AB+",
        district: "Distrito Demo 103"
      },
      appointments: [
        { date: "2026-11-23", time: "09:30", specialty: "Medicina General", provider: "Dra. Ana Martínez", status: "Próxima", reason: "Seguimiento ficticio." },
        { date: "2026-10-30", time: "14:00", specialty: "Cardiología", provider: "Dr. Jorge Salazar", status: "Atendida", reason: "Consulta de muestra." }
      ],
      consultations: [
        { date: "2026-10-30", specialty: "Cardiología", provider: "Dr. Jorge Salazar", summary: "Consulta ficticia de control." }
      ],
      history: {
        allergies: ["Alimento de muestra (moderada)"],
        conditions: ["Migraña (registro ficticio)"],
        vaccines: ["Refuerzo · 2025-09-15 (muestra)"],
        procedures: ["Sin procedimientos ficticios registrados."]
      },
      medications: [
        { name: "Tratamiento de muestra", dose: "250 mg", schedule: "Una vez al día (muestra)" }
      ],
      emergency: { contact: "Contacto Demo Verónica", relationship: "Familiar ficticio", phone: "+51 000 000 203" }
    }
  };

  const VISTAS = [
    ["perfil", "Perfil"],
    ["citas", "Citas"],
    ["consultas", "Consultas"],
    ["historial", "Historial clínico"],
    ["medicamentos", "Medicamentos"],
    ["qr", "QR de emergencia"]
  ];

  const app = document.getElementById("demo-app");
  let sesion = null;
  let vistaActual = "perfil";
  let aviso = "";

  function escapar(valor) {
    return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (caracter) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[caracter];
    });
  }

  function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  function renderAcceso() {
    app.innerHTML = `
      <main class="demo-access">
        <div class="demo-brand"><span class="demo-mark" aria-hidden="true">M</span> MediQR Demo</div>
        <p class="demo-tag">PREVIEW AISLADO</p>
        <h1>Explora el portal del paciente</h1>
        <p class="demo-muted">Elige uno de los tres perfiles ficticios. No se piden contraseñas y esta sesión solo existe en la memoria de esta página.</p>
        <div class="demo-warning" role="note">Toda la información es inventada para una demostración académica. No introduzcas datos reales.</div>
        <div class="demo-personas" role="group" aria-label="Perfiles ficticios">
          ${Object.keys(PERSONAS).map(function (id) {
            return `<button type="button" class="demo-persona" data-demo-persona="${id}">Entrar como ${escapar(PERSONAS[id].label)}</button>`;
          }).join("")}
        </div>
        <p class="demo-footer">Perfil PACIENTE simulado. No se consulta ni modifica ningún sistema externo.</p>
      </main>`;
  }

  function lista(items, renderItem) {
    if (!items.length) return '<p class="demo-muted">No hay elementos ficticios para mostrar.</p>';
    return `<ul class="demo-list">${items.map(renderItem).join("")}</ul>`;
  }

  function vistaPerfil(datos) {
    const perfil = datos.profile;
    return `
      <h2>Perfil del paciente</h2>
      <p class="demo-muted">Datos ficticios de ${escapar(perfil.firstName)}.</p>
      <form class="demo-form" data-demo-form="perfil">
        <label>Nombre<input name="firstName" value="${escapar(perfil.firstName)}" required></label>
        <label>Apellidos<input name="lastName" value="${escapar(perfil.lastName)}" required></label>
        <label>Correo de muestra<input value="${escapar(perfil.email)}" readonly></label>
        <label>Teléfono ficticio<input name="phone" value="${escapar(perfil.phone)}"></label>
        <label>Tipo de sangre<input value="${escapar(perfil.bloodType)}" readonly></label>
        <label>Distrito ficticio<input value="${escapar(perfil.district)}" readonly></label>
        <button class="demo-button" type="submit">Guardar en esta sesión</button>
      </form>`;
  }

  function vistaCitas(datos) {
    return `
      <h2>Citas</h2>
      <p class="demo-muted">Agenda de ejemplo; agregar una cita solo cambia esta sesión.</p>
      ${lista(datos.appointments, function (cita) {
        return `<li><strong>${escapar(cita.date)} · ${escapar(cita.time)} · ${escapar(cita.specialty)}</strong><span>${escapar(cita.provider)} · ${escapar(cita.status)}</span><span>${escapar(cita.reason)}</span></li>`;
      })}
      <form class="demo-form" data-demo-form="cita">
        <label>Especialidad de muestra<input name="specialty" required maxlength="60"></label>
        <label>Fecha de muestra<input name="date" type="date" required></label>
        <button class="demo-button" type="submit">Agregar cita ficticia</button>
      </form>`;
  }

  function vistaConsultas(datos) {
    return `
      <h2>Consultas</h2>
      <p class="demo-muted">Notas ilustrativas; no son indicaciones clínicas.</p>
      ${lista(datos.consultations, function (consulta) {
        return `<li><strong>${escapar(consulta.date)} · ${escapar(consulta.specialty)}</strong><span>${escapar(consulta.provider)}</span><span>${escapar(consulta.summary)}</span></li>`;
      })}`;
  }

  function vistaHistorial(datos) {
    const historial = datos.history;
    return `
      <h2>Historial clínico</h2>
      <p class="demo-muted">Resumen ficticio, sin valor clínico.</p>
      <div class="demo-card-grid">
        <article class="demo-card"><h3>Alergias</h3>${lista(historial.allergies, function (item) { return `<li>${escapar(item)}</li>`; })}</article>
        <article class="demo-card"><h3>Condiciones</h3>${lista(historial.conditions, function (item) { return `<li>${escapar(item)}</li>`; })}</article>
        <article class="demo-card"><h3>Vacunas</h3>${lista(historial.vaccines, function (item) { return `<li>${escapar(item)}</li>`; })}</article>
        <article class="demo-card"><h3>Procedimientos</h3>${lista(historial.procedures, function (item) { return `<li>${escapar(item)}</li>`; })}</article>
      </div>`;
  }

  function vistaMedicamentos(datos) {
    return `
      <h2>Medicamentos</h2>
      <p class="demo-muted">Tratamientos de muestra; no generan recetas ni recordatorios reales.</p>
      ${lista(datos.medications, function (medicamento) {
        return `<li><strong>${escapar(medicamento.name)} · ${escapar(medicamento.dose)}</strong><span>${escapar(medicamento.schedule)}</span></li>`;
      })}`;
  }

  function vistaQr(datos) {
    const perfil = datos.profile;
    const emergencia = datos.emergency;
    return `
      <h2>QR de emergencia</h2>
      <p class="demo-muted">Ficha ilustrativa asociada a un QR ficticio.</p>
      <article class="demo-qr-card">
        <p class="demo-tag">FICHA DE EMERGENCIA · DEMO</p>
        <h3>${escapar(perfil.firstName)} ${escapar(perfil.lastName)}</h3>
        <p>Tipo de sangre de muestra: <strong>${escapar(perfil.bloodType)}</strong></p>
        <p>Contacto: ${escapar(emergencia.contact)} (${escapar(emergencia.relationship)})</p>
        <p>Teléfono de muestra: ${escapar(emergencia.phone)}</p>
        <p class="demo-warning">No es un QR escaneable, no contiene token y no publica información.</p>
      </article>`;
  }

  function contenido(datos) {
    return {
      perfil: vistaPerfil(datos),
      citas: vistaCitas(datos),
      consultas: vistaConsultas(datos),
      historial: vistaHistorial(datos),
      medicamentos: vistaMedicamentos(datos),
      qr: vistaQr(datos)
    }[vistaActual];
  }

  function renderPortal() {
    if (!sesion) {
      renderAcceso();
      return;
    }

    const persona = PERSONAS[sesion.id];
    const nombre = `${sesion.datos.profile.firstName} ${sesion.datos.profile.lastName}`.trim();
    app.innerHTML = `
      <div class="demo-shell">
        <header class="demo-topbar">
          <div>
            <div class="demo-brand"><span class="demo-mark" aria-hidden="true">M</span> MediQR Demo</div>
            <p>${escapar(nombre)} · PACIENTE simulado</p>
          </div>
          <div class="demo-top-actions">
            <span class="demo-tag">DEMO · datos ficticios</span>
            <button type="button" class="demo-button" data-demo-action="cambiar">Cambiar perfil</button>
          </div>
        </header>
        <div class="demo-layout">
          <nav class="demo-nav" aria-label="Módulos del paciente">
            ${VISTAS.map(function (item) {
              return `<button type="button" data-demo-view="${item[0]}" ${vistaActual === item[0] ? 'aria-current="page"' : ""}>${item[1]}</button>`;
            }).join("")}
          </nav>
          <main class="demo-main" id="demo-content" aria-live="polite">
            ${aviso ? `<p class="demo-warning" role="status">${escapar(aviso)}</p>` : ""}
            ${contenido(sesion.datos)}
            <p class="demo-footer">Los cambios se conservan solo en memoria y se pierden al recargar o cambiar de perfil.</p>
          </main>
        </div>
      </div>`;
    app.dataset.persona = sesion.id;
  }

  app.addEventListener("click", function (event) {
    const persona = event.target.closest("[data-demo-persona]");
    if (persona) {
      const id = persona.dataset.demoPersona;
      if (!Object.prototype.hasOwnProperty.call(PERSONAS, id)) return;
      sesion = { id: id, datos: clonar(PERSONAS[id]) };
      vistaActual = "perfil";
      aviso = "";
      renderPortal();
      return;
    }

    const navegacion = event.target.closest("[data-demo-view]");
    if (navegacion && sesion) {
      vistaActual = navegacion.dataset.demoView;
      aviso = "";
      renderPortal();
      return;
    }

    const accion = event.target.closest("[data-demo-action]");
    if (accion && accion.dataset.demoAction === "cambiar") {
      sesion = null;
      aviso = "";
      renderAcceso();
    }
  });

  app.addEventListener("submit", function (event) {
    const formulario = event.target.closest("[data-demo-form]");
    if (!formulario || !sesion) return;
    event.preventDefault();

    if (formulario.dataset.demoForm === "perfil") {
      sesion.datos.profile.firstName = formulario.querySelector('[name="firstName"]').value.trim();
      sesion.datos.profile.lastName = formulario.querySelector('[name="lastName"]').value.trim();
      sesion.datos.profile.phone = formulario.querySelector('[name="phone"]').value.trim();
      aviso = "Perfil ficticio actualizado en memoria.";
    } else if (formulario.dataset.demoForm === "cita") {
      const especialidad = formulario.querySelector('[name="specialty"]').value.trim();
      const fecha = formulario.querySelector('[name="date"]').value;
      if (!especialidad || !fecha) return;
      sesion.datos.appointments.unshift({
        date: fecha,
        time: "12:00",
        specialty: especialidad,
        provider: "Personal ficticio",
        status: "Pendiente · demo",
        reason: "Cita agregada solo en memoria."
      });
      vistaActual = "citas";
      aviso = "Cita ficticia agregada en memoria.";
    }

    renderPortal();
  });

  renderAcceso();
})();
