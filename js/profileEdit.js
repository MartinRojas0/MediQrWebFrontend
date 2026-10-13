// Edición visual de Información Personal
function enablePersonalEdit() {
  document.getElementById('personal-read-view').classList.add('hidden');
  document.getElementById('personal-edit-form').classList.remove('hidden');
  document.getElementById('btn-edit-personal').classList.add('hidden');
}

function cancelPersonalEdit() {
  document.getElementById('personal-read-view').classList.remove('hidden');
  document.getElementById('personal-edit-form').classList.add('hidden');
  document.getElementById('btn-edit-personal').classList.remove('hidden');
}

function savePersonalEdit(e) {
  e.preventDefault();
  document.getElementById('val-name').textContent = document.getElementById('inp-name').value;
  document.getElementById('val-lastname').textContent = document.getElementById('inp-lastname').value;
  document.getElementById('val-dni').textContent = document.getElementById('inp-dni').value;
  document.getElementById('val-birth').textContent = document.getElementById('inp-birth').value;
  document.getElementById('val-email').textContent = document.getElementById('inp-email').value;
  document.getElementById('val-phone').textContent = document.getElementById('inp-phone').value;

  alert('¡Información personal actualizada visualmente!');
  cancelPersonalEdit();
}

// Edición visual de Información Médica
function enableMedicalEdit() {
  document.getElementById('medical-read-view').classList.add('hidden');
  document.getElementById('medical-edit-form').classList.remove('hidden');
  document.getElementById('btn-edit-medical').classList.add('hidden');
}

function cancelMedicalEdit() {
  document.getElementById('medical-read-view').classList.remove('hidden');
  document.getElementById('medical-edit-form').classList.add('hidden');
  document.getElementById('btn-edit-medical').classList.remove('hidden');
}

function saveMedicalEdit(e) {
  e.preventDefault();
  document.getElementById('val-blood').textContent = document.getElementById('inp-blood').value;
  document.getElementById('val-allergies').textContent = document.getElementById('inp-allergies').value;
  document.getElementById('val-conditions').textContent = document.getElementById('inp-conditions').value;
  document.getElementById('val-notes').textContent = document.getElementById('inp-notes').value;

  alert('¡Información médica actualizada visualmente!');
  cancelMedicalEdit();
}
