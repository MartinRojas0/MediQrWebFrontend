// Auditoria funcional: recorre vistas y dialogos y comprueba que cada control
// tenga una accion registrada. El registro vive en MediAcciones.registro,
// no como propiedad directa de MediAcciones.
window.addEventListener('load', function () {
  setTimeout(function () {
    var q = function (s) { return document.querySelector(s); };
    var qa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
    var reg = MediAcciones.registro;
    var out = [];
    var sinRegistro = {};
    var registroUsado = {};

    function hayAccion(nombre) {
      return Object.prototype.hasOwnProperty.call(reg, nombre);
    }

    function auditar(marca) {
      qa('[data-action]').forEach(function (el) {
        var a = el.getAttribute('data-action');
        if (a.indexOf('${') === 0 || a.indexOf('${') > -1) return;
        registroUsado[a] = true;
        if (!hayAccion(a)) {
          sinRegistro[a] = (sinRegistro[a] || []).concat(marca);
        }
      });
    }

    var dialogos = [];

    function abrirYAuditar(boton, marca) {
      try { boton.click(); } catch (e) {
        out.push('  EXCEPCION ' + marca + ': ' + e.message);
        return;
      }
      setTimeout(function () {
        var d = q('#module-dialog');
        if (d && d.open) {
          var titulo = q('#module-dialog-title');
          dialogos.push(marca + ' -> ' + (titulo ? titulo.textContent.trim() : '(sin titulo)'));
          auditar(marca);
          var cerrar = q('#module-dialog [data-action="modal:cerrar"]');
          if (cerrar) cerrar.click(); else d.close();
        }
        setTimeout(continuar, 40);
      }, 80);
    }

    var cola = [];
    ['inicio', 'salud', 'historial', 'citas', 'documentos', 'perfil'].forEach(function (v) {
      cola.push(function () {
        location.hash = '#/' + v;
        setTimeout(function () {
          auditar(v);
          out.push('VISTA ' + v);

          // Pestanas internas de Perfil: hay que abrirlas una a una.
          var pestanas = qa('[data-action="perfil:pestana"]');
          if (pestanas.length) {
            var i = 0;
            (function siguiente() {
              if (i >= pestanas.length) { terminarVista(); return; }
              pestanas[i].click();
              auditar(v + '/pestana' + i);
              i++;
              setTimeout(siguiente, 50);
            })();
            return;
          }
          terminarVista();
        }, 150);
      });
    });

    var disparadoresPorVista = {};
    var vistasPendientes = [];

    function terminarVista() {
      disparadoresPorVista[location.hash.replace('#/', '')] = qa('[data-action]').filter(function (b) {
        return /form|detalle|:ver|pedir|password|agregar-contacto|cerrar-sesion|salud:aplicar/.test(b.getAttribute('data-action'));
      });
      siguiente();
    }

    var i = 0;
    function siguiente() {
      if (i < cola.length) { cola[i++](); return; }

      // Segunda pasada: abrir dialogos, uno a uno, por vista.
      var pasos = [];
      Object.keys(disparadoresPorVista).forEach(function (v) {
        disparadoresPorVista[v].forEach(function (b, j) {
          pasos.push({ v: v, b: b, j: j });
        });
      });

      var k = 0;
      function abrirSiguiente() {
        if (k >= pasos.length) { informe(); return; }
        var p = pasos[k++];
        location.hash = '#/' + p.v;
        setTimeout(function () {
          var b = qa('[data-action]').filter(function (x) {
            return x.getAttribute('data-action') === p.b.getAttribute('data-action') &&
                   (p.b.dataset.id === undefined || x.dataset.id === p.b.dataset.id);
          })[0];
          if (!b) { abrirSiguiente(); return; }
          abrirYAuditar(b, p.v + '/' + p.b.getAttribute('data-action') + '#' + p.j);
        }, 120);
      }
      abrirSiguiente();
    }

    function informe() {
      out.push('');
      out.push('DIALOGOS ABIERTOS: ' + dialogos.length);
      dialogos.forEach(function (d) { out.push('  ' + d); });
      out.push('');
      var claves = Object.keys(registroUsado);
      out.push('ACCIONES EN MARCADO: ' + claves.length + '  REGISTRADAS: ' + Object.keys(reg).length);
      out.push('SIN REGISTRO: ' + (Object.keys(sinRegistro).length
        ? Object.keys(sinRegistro).map(function (a) { return a + ' (' + sinRegistro[a][0] + ')'; }).join(', ')
        : 'ninguna'));
      var huerfanas = Object.keys(reg).filter(function (a) { return !registroUsado[a]; });
      out.push('REGISTRADAS PERO SIN USAR: ' + (huerfanas.length ? huerfanas.join(', ') : 'ninguna'));

      var pre = document.createElement('pre');
      pre.id = 'AUDIT';
      pre.textContent = out.join('\n');
      document.body.appendChild(pre);
    }

    siguiente();
  }, 800);
});