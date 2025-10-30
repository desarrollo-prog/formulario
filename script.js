// ------------------- FUNCIÓN MD5 PARA PAYU -------------------
function md5(string) {
  return CryptoJS.MD5(string).toString();
}

// ------------------- SLIDER -------------------
const left = document.querySelector('.left');
const dots = document.querySelectorAll('.dot');

const fondos = [
  "url('img/slider1.jpeg')",
  "url('img/slider2.png')",
  "url('img/slider1.jpeg')"
];

let index = 0;
let intervalo;

function cambiarFondo(nuevoIndex = null) {
  if (nuevoIndex !== null) index = nuevoIndex;
  else index = (index + 1) % fondos.length;

  left.style.backgroundImage = fondos[index];
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
}

function iniciarSlider() {
  intervalo = setInterval(() => cambiarFondo(), 4000);
}

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    clearInterval(intervalo);
    cambiarFondo(i);
    iniciarSlider();
  });
});

left.style.backgroundImage = fondos[0];
dots[0].classList.add('active');
iniciarSlider();

// ------------------- PRECIO Y PAYU -------------------
const tipoPersona = document.getElementById('tipoPersona');
const ubicacion = document.getElementById('ubicacion');
const campoUbicacion = document.getElementById('campoUbicacion');
const precioTexto = document.getElementById('precio');
const btnPayu = document.getElementById('btnPayu');

function actualizarPrecio() {
  let precio = null;

  if (tipoPersona.value === 'natural') {
    campoUbicacion.classList.add('oculto');
    ubicacion.value = '';
    precio = 846983;
  } else if (tipoPersona.value === 'empresa') {
    campoUbicacion.classList.remove('oculto');
    if (ubicacion.value === 'bogota') precio = 763000;
    else if (ubicacion.value === 'fuera') precio = 769000;
  }

  if (precio) {
    precioTexto.textContent = `Precio: $${precio.toLocaleString('es-CO')}`;
    btnPayu.textContent = `Pagar $${precio.toLocaleString('es-CO')} con PayU (Sandbox)`;
    btnPayu.dataset.valor = precio;
  } else {
    precioTexto.textContent = '';
    btnPayu.textContent = 'Pagar con PayU (Sandbox)';
    btnPayu.dataset.valor = '';
  }
}

tipoPersona.addEventListener('change', actualizarPrecio);
ubicacion.addEventListener('change', actualizarPrecio);

// ------------------- DETECTAR ID DEL VENDEDOR EN LA URL -------------------
// Soporta ?vendedor=vendedor1 y ?vendedor1 (sin "=")
function detectVendedorFromURL() {
  const query = window.location.search.toLowerCase();

  // Caso 1: ?vendedor=vendedor2
  const params = new URLSearchParams(query);
  if (params.has('vendedor')) return params.get('vendedor');

  // Caso 2: ?vendedor2 (sin "=")
  const match = query.match(/\?vendedor(\d+)/i);
  if (match) return `vendedor${match[1]}`;

  // Si no hay nada, devolver "sin_vendedor"
  return 'sin_vendedor';
}

const idVendedor = detectVendedorFromURL();
const inputVendedor = document.getElementById('vendedor');
if (inputVendedor) inputVendedor.value = idVendedor;

// ------------------- BOTÓN PAYU -------------------
btnPayu.addEventListener('click', () => {
  const valor = btnPayu.dataset.valor;
  if (!valor) {
    alert('Por favor seleccione tipo de cliente y ubicación antes de pagar.');
    return;
  }

  // Capturar datos del formulario
  const form = document.getElementById('formulario');
  const formData = new FormData(form);

  const nombre = formData.get('nombre');
  const apellido = formData.get('apellido');
  const correo = formData.get('correo');
  const telefono = formData.get('telefono');
  const tipo = document.getElementById('tipoPersona').value;
  const ubi = document.getElementById('ubicacion').value || 'N/A';
  const vendedor = document.getElementById('vendedor').value || 'sin_vendedor';

  if (!nombre || !apellido || !correo || !telefono) {
    alert('Por favor completa todos los campos antes de continuar.');
    return;
  }

  // Datos PayU Sandbox
  const apiKey = "4Vj8eK4rloUd272L48hsrarnUA"; // CLAVE DE PRUEBA PayU
  const merchantId = "508029";
  const accountId = "512321";
  const currency = "COP";
  const referenceCode = `CJI_${Date.now()}_${vendedor}`;
  const amount = valor;

  // Generar firma MD5 (sandbox)
  const rawSignature = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
  const signature = md5(rawSignature);

  // Rellenar formulario oculto PayU
  const payuForm = document.getElementById('formPayu');
  document.getElementById('referenceCode').value = referenceCode;
  document.getElementById('amount').value = amount;
  document.getElementById('signature').value = signature;
  document.getElementById('buyerEmail').value = correo;
  document.getElementById('extra1').value = tipo; // tipoPersona
  document.getElementById('extra2').value = ubi;  // ubicación

  // Enviar teléfono como extra3
  const inputExtra3 = document.createElement('input');
  inputExtra3.type = 'hidden';
  inputExtra3.name = 'extra3';
  inputExtra3.value = telefono;
  payuForm.appendChild(inputExtra3);

  // === APPS SCRIPT URL (RESPONSE/CONFIRMATION) ===
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz12l7iPYTuI3xIonugnZA-l4Y_4NotZTKp7BKn-c81CUeLKzV3qfZI3qoNSs10BBqiVA/exec";

  // PayU mandará un POST a estas URLs; incluimos vendedor
  const responseUrl = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
  const confirmationUrl = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;

  document.getElementById('responseUrl').value = responseUrl;
  document.getElementById('confirmationUrl').value = confirmationUrl;

  // Rellenar merchant/account
  payuForm.querySelector('input[name="merchantId"]').value = merchantId;
  payuForm.querySelector('input[name="accountId"]').value = accountId;

  // Enviar al gateway PayU Sandbox
  document.body.appendChild(payuForm);
  payuForm.submit();
});
