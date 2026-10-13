// ==========================================================
// MediQR · Vista Inicio
//
// Marcado del panel de inicio del paciente. Se renderiza una sola vez
// al arrancar; el contenido es estatico salvo los enlaces a otras vistas.
// ==========================================================
(function () {
  "use strict";

  var MARCADO = `      <div class="header-welcome">
        <h1>Hola, Paciente Demo <i data-icon="hand" class="icon-wave"></i></h1>
        <p class="text-muted">Esto es lo más importante de tu salud hoy.</p>
      </div>

      <div class="dashboard-grid">

        <!-- 2. TARJETA QR DE EMERGENCIA (DESTACADA) -->
        <article class="card card-featured">
          <div class="card-header">
            <h3><i data-icon="qrcode"></i> QR de Emergencia</h3>
            <span class="badge badge-danger"><i data-icon="triangle-exclamation"></i> EMERGENCIA</span>
          </div>
          <div class="qr-content-flex">
            <div class="qr-info">
              <h4>Paciente Demo</h4>
              <p><strong>Grupo sanguíneo:</strong> O+</p>
              <p><strong>Alergias:</strong> Penicilina, Aspirina</p>
              <p><strong>Condiciones:</strong> Hipertensión leve</p>
            </div>
            <div class="qr-preview">
              <!-- SVG de QR visual mock sin necesidad de archivos de imagen -->
              <svg width="90" height="90" viewBox="0 0 100 100" style="background:#fff; padding:4px; border-radius:8px; border:1px solid #e2e8f0;">
                <rect width="100" height="100" fill="#ffffff"/>
                <path d="M10 10h30v30H10zM60 10h30v30H60zM10 60h30v30H10z" fill="#0284c7"/>
                <path d="M20 20h10v10H20zM70 20h10v10H70zM20 70h10v10H20z" fill="#ffffff"/>
                <rect x="50" y="50" width="15" height="15" fill="#0284c7"/>
                <rect x="75" y="75" width="15" height="15" fill="#0284c7"/>
                <rect x="50" y="75" width="15" height="15" fill="#0284c7"/>
              </svg>
            </div>
          </div>
          <div class="card-actions mt-1">
            <button class="btn btn-outline"  data-action="perfil:ver-qr">Ver QR</button>
            <button class="btn btn-primary"  data-action="demo:aviso" data-mensaje="Descargando QR visual...">Descargar QR</button>
          </div>
        </article>

        <!-- 3. PRÓXIMA CITA -->
        <article class="card">
          <div class="card-header">
            <h3><i data-icon="calendar-check"></i> Próxima Cita</h3>
            <span class="badge badge-info">Próxima</span>
          </div>
          <p><strong>Especialidad:</strong> Odontología</p>
          <p><strong>Médico:</strong> Dr. Carlos Pérez</p>
          <p><strong>Fecha:</strong> 25 de septiembre</p>
          <p><strong>Hora:</strong> 10:30 AM</p>
          <p><strong>Lugar:</strong> Clínica MediSalud</p>
          <button class="btn btn-secondary full-width mt-1"  data-action="nav:ir" data-ruta="citas">Ver cita</button>
        </article>

        <!-- 4. ÚLTIMA CONSULTA -->
        <article class="card">
          <h3><i data-icon="stethoscope"></i> Última Consulta</h3>
          <p><strong>Especialidad:</strong> Medicina General</p>
          <p><strong>Médico:</strong> Dra. Ana Martínez</p>
          <p><strong>Fecha:</strong> 10 de agosto</p>
          <p><strong>Diagnóstico:</strong> Rinitis Alérgica</p>
          <p class="text-muted"><small>Se receta antihistamínico. Control en caso de persistencia.</small></p>
          <button class="btn btn-secondary full-width mt-1"  data-action="demo:aviso" data-mensaje="Dirigiendo visualmente a Detalle de Consulta...">Ver consulta</button>
        </article>

        <!-- 5. MEDICAMENTOS -->
        <article class="card">
          <h3><i data-icon="pills"></i> Medicamentos</h3>
          <p><strong>Nombre:</strong> Paracetamol</p>
          <p><strong>Dosis:</strong> 500 mg</p>
          <p><strong>Frecuencia:</strong> Cada 8 horas</p>
          <div class="dose-highlight mt-1">
            <span>Próxima dosis:</span>
            <strong>18:00</strong>
          </div>
          <p class="mt-1"><small>Recordatorio: <strong>Activado</strong></small></p>
          <button class="btn btn-secondary full-width mt-1"  data-action="demo:aviso" data-mensaje="Dirigiendo visualmente a Medicamentos...">Ver medicamentos</button>
        </article>

        <!-- 6. ACCESOS RÁPIDOS -->
        <article class="card card-full">
          <h3><i data-icon="bolt"></i> Accesos Rápidos</h3>
          <div class="quick-access-grid mt-1">
            <button class="qa-btn"  data-action="demo:aviso" data-mensaje="Dirigiendo a Historial clínico">
              <span class="qa-icon"><i data-icon="file-medical"></i></span>
              <span>Historial clínico</span>
            </button>
            <button class="qa-btn"  data-action="demo:aviso" data-mensaje="Dirigiendo a Medicamentos">
              <span class="qa-icon"><i data-icon="capsules"></i></span>
              <span>Medicamentos</span>
            </button>
           <button class="qa-btn"  data-action="nav:ir" data-ruta="citas">
            <span class="qa-icon">
              <i data-icon="calendar-days"></i>
            </span>
            <span>Citas</span>
          </button>
            <button class="qa-btn"  data-action="nav:ir" data-ruta="documentos">
              <span class="qa-icon"><i data-icon="folder-open"></i></span>
              <span>Documentos</span>
            </button>
          </div>
        </article>

      </div>`;

  function render() {
    var destino = document.getElementById("view-inicio");

    if (destino && !destino.dataset.renderizado) {
      destino.innerHTML = MARCADO;
      destino.dataset.renderizado = "1";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
