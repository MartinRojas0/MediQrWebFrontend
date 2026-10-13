// Alternar entre VISTA INICIO y VISTA PERFIL desde el Navbar
function switchSection(section) {
  document.getElementById('view-inicio').classList.add('hidden');
  document.getElementById('view-perfil').classList.add('hidden');
  document.getElementById('nav-inicio').classList.remove('active');
  document.getElementById('nav-perfil').classList.remove('active');

  if (section === 'inicio') {
    document.getElementById('view-inicio').classList.remove('hidden');
    document.getElementById('nav-inicio').classList.add('active');
  } else if (section === 'perfil') {
    document.getElementById('view-perfil').classList.remove('hidden');
    document.getElementById('nav-perfil').classList.add('active');
  }
}

// Alternar entre pestañas dentro de PERFIL
function switchProfileTab(tabId) {
  document.querySelectorAll('.profile-tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.sb-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById('ptab-' + tabId).classList.remove('hidden');
  event.currentTarget.classList.add('active');
}
