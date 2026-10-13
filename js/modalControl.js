function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Validaciones visuales para Cambiar Contraseña (Punto 12)
function handlePasswordChange(e) {
  e.preventDefault();
  const curr = document.getElementById('pass-curr').value;
  const newP = document.getElementById('pass-new').value;
  const confP = document.getElementById('pass-conf').value;
  const errBox = document.getElementById('pass-error');

  if (!curr || !newP || !confP) {
    errBox.textContent = "Todos los campos son obligatorios.";
    errBox.classList.remove('hidden');
    return;
  }

  if (newP.length < 6) {
    errBox.textContent = "La nueva contraseña debe tener al menos 6 caracteres.";
    errBox.classList.remove('hidden');
    return;
  }

  if (newP !== confP) {
    errBox.textContent = "Las contraseñas no coinciden.";
    errBox.classList.remove('hidden');
    return;
  }

  errBox.classList.add('hidden');
  alert("Contraseña cambiada visualmente con éxito.");
  closeModal('modal-change-password');
}