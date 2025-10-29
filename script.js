// ------------------- FUNCIÓN MD5 PARA PAYU -------------------
function md5(string) {
  return CryptoJS.MD5(string).toString();
}

// ------------------- SLIDER (igual que antes) -------------------
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
// Soporta ?vendedor=vendedor1 y ?vendedor1
function detectVendedorFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('vendedor')) return params.get('vendedor');

  // Si no tiene "=", puede venir así: ?vendedor1
  const raw = window.location.search.replace(/^\?/, '');
  if (/^vendedor\d+/i.test(raw)) return raw;
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

  // Rellenar formulario oculto
  const payuForm = document.getElementById('formPayu');
  document.getElementById('referenceCode').value = referenceCode;
  document.getElementById('amount').value = amount;
  document.getElementById('signature').value = signature;
  document.getElementById('buyerEmail').value = correo;
  document.getElementById('extra1').value = tipo;      // opcional: tipo
  document.getElementById('extra2').value = ubi;       // opcional: ubicación

  // === APPS SCRIPT URL (RESPONSE/CONFIRMATION) ===
  // ---------- CAMBIA ESTO POR TU URL /exec ----------
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVIQQc2FIxEOE5_NHHplwdi9gx2roTzl2CVUZururJviHrwPOtYV5t1eBBTOPyiE1_Vg/exec";
  // -------------------------------------------------

  // PayU mandará un POST a estas URLs; incluimos vendedor en query param
  const responseUrl = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
  const confirmationUrl = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;

  document.getElementById('responseUrl').value = responseUrl;
  document.getElementById('confirmationUrl').value = confirmationUrl;

  // Rellenar merchant/account
  payuForm.querySelector('input[name="merchantId"]').value = merchantId;
  payuForm.querySelector('input[name="accountId"]').value = accountId;

  // Enviar al gateway (sandbox)
  document.body.appendChild(payuForm);
  payuForm.submit();
});
