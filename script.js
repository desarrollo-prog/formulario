document.addEventListener('DOMContentLoaded', () => {
  // ------------------- SLIDER (con defensas) -------------------
  const left = document.querySelector('.left');
  const dots = document.querySelectorAll('.dot');

  const fondos = [
    "url('img/slider1.jpeg')",
    "url('img/slider2.png')",
    "url('img/slider1.jpeg')"
  ];

  if (left && dots.length === fondos.length && fondos.length > 0) {
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
  }

  // ------------------- ELEMENTOS DEL FORM -------------------
  const tipoPersona = document.getElementById('tipoPersona');
  const ubicacion = document.getElementById('ubicacion');
  const campoUbicacion = document.getElementById('campoUbicacion');
  const precioTexto = document.getElementById('precio');
  const btnPayu = document.getElementById('btnPayu');

  // Inputs
  const inputNombre   = document.getElementById('nombre');
  const inputCorreo   = document.getElementById('correo');
  const inputEmpresa  = document.getElementById('empresa');
  const inputTelefono = document.getElementById('telefono');

  // Actualizar etiquetas si existen
  const setLabelText = (forId, text) => {
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) label.textContent = text;
  };
  setLabelText('nombre',  'Ingrese su nombre completo');
  setLabelText('correo',  'Ingrese su correo electrónico');
  setLabelText('empresa', 'Ingrese el nombre de su empresa');
  setLabelText('telefono','Ingrese su número de celular');

  // Placeholders
  if (inputNombre)   inputNombre.placeholder   = 'Ingrese su nombre completo';
  if (inputCorreo)   inputCorreo.placeholder   = 'Ingrese su correo electrónico';
  if (inputEmpresa)  inputEmpresa.placeholder  = 'Ingrese el nombre de su empresa';
  if (inputTelefono) inputTelefono.placeholder = 'Ingrese su número de celular';

  // ------------------- PRECIO / VISIBILIDAD / EMPRESA enable/disable -------------------
 function actualizarPrecio() {
  let precio = null;
  const campoEmpresa = document.getElementById('campoEmpresa');
  const inputEmpresa = document.getElementById('empresa');

  if (tipoPersona && tipoPersona.value === 'natural') {
    // Ocultar ubicación
    campoUbicacion?.classList.add('oculto');
    ubicacion?.removeAttribute('required');
    if (ubicacion) ubicacion.value = '';

    // Ocultar campo Empresa
    campoEmpresa?.classList.add('oculto');
    inputEmpresa?.removeAttribute('required');
    inputEmpresa.value = '';

    // Precio persona natural
    precio = 846983;
  } else if (tipoPersona && tipoPersona.value === 'empresa') {
    // Mostrar ubicación
    campoUbicacion?.classList.remove('oculto');
    ubicacion?.setAttribute('required', 'required');

    // Mostrar campo Empresa y hacerlo requerido
    campoEmpresa?.classList.remove('oculto');
    inputEmpresa?.setAttribute('required', 'required');

    // Precio según ubicación
    if (ubicacion) {
      if (ubicacion.value === 'bogota') precio = 763000;
      else if (ubicacion.value === 'fuera') precio = 769000;
    }
  }

  // Mostrar precio
  if (precio !== null) {
    precioTexto.textContent = `Precio: $${precio.toLocaleString('es-CO')}`;
    if (btnPayu) {
      btnPayu.textContent = `Pagar $${precio.toLocaleString('es-CO')} con PayU (Sandbox)`;
      btnPayu.dataset.valor = String(precio);
    }
  } else {
    precioTexto.textContent = '';
    if (btnPayu) {
      btnPayu.textContent = 'Pagar con PayU (Sandbox)';
      btnPayu.dataset.valor = '';
    }
  }
}


  tipoPersona?.addEventListener('change', actualizarPrecio);
  ubicacion?.addEventListener('change', actualizarPrecio);
  actualizarPrecio(); // inicial

  // ------------------- DETECTAR VENDEDOR DESDE URL -------------------
  function detectVendedorFromURL() {
    const query = (window.location.search || '').toLowerCase();
    const params = new URLSearchParams(query);
    if (params.has('vendedor')) return params.get('vendedor') || 'sin_vendedor';
    const match = query.match(/\?vendedor(\d+)/i);
    if (match) return `vendedor${match[1]}`;
    return 'sin_vendedor';
  }

  const idVendedor = detectVendedorFromURL();
  const inputVendedor = document.getElementById('vendedor');
  if (inputVendedor) inputVendedor.value = idVendedor;

  // ------------------- PAGO PAYU -------------------
  btnPayu?.addEventListener('click', () => {
    const valor = btnPayu.dataset.valor;
    if (!valor) {
      alert('Por favor, seleccione el tipo de cliente y (si aplica) la ubicación antes de pagar.');
      return;
    }

    // Validación nativa del formulario
    const form = document.getElementById('formulario');
    if (form && !form.reportValidity()) return;

    const formData = new FormData(form);
    const empresa  = (formData.get('empresa')  || '').toString();
    const correo   = (formData.get('correo')   || '').toString();
    const telefono = (formData.get('telefono') || '').toString();
    const tipo     = tipoPersona?.value || '';
    const ubi      = ubicacion?.value || 'N/A';
    const vendedor = inputVendedor?.value || 'sin_vendedor';

    // Verificar CryptoJS
    if (typeof CryptoJS === 'undefined' || !CryptoJS.MD5) {
      alert('No se pudo inicializar la librería de firma (CryptoJS). Revisa tu conexión de red o el CDN.');
      return;
    }

    // ---- Credenciales de Sandbox (PayU demo) ----
    const apiKey = '4Vj8eK4rloUd272L48hsrarnUA';
    const merchantId = '508029';
    const accountId = '512321';
    const currency = 'COP';

    // Referencia única
    const referenceCode = `CJI_${Date.now()}_${vendedor}`;
    const amount = valor;

    // Firma
    const rawSignature = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    const signature = CryptoJS.MD5(rawSignature).toString();

    // ---- Form que se envía a PayU ----
    const payuForm = document.getElementById('formPayu');

    // Helper para setear valores por id
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    };

    setValue('referenceCode', referenceCode);
    setValue('amount', amount);
    setValue('signature', signature);
    setValue('buyerEmail', correo);
    setValue('extra1', tipo);
    setValue('extra2', ubi);

    // Limpiar duplicados por reintentos y crear extra3/extra4 (TEL/EMPRESA)
    ['extra3', 'extra4'].forEach((name) => {
      payuForm.querySelectorAll(`input[name="${name}"]`).forEach((el) => el.remove());
    });
    const inputExtra3 = document.createElement('input'); // teléfono
    inputExtra3.type = 'hidden';
    inputExtra3.name = 'extra3';
    inputExtra3.value = telefono;
    payuForm.appendChild(inputExtra3);

    const inputExtra4 = document.createElement('input'); // empresa
    inputExtra4.type = 'hidden';
    inputExtra4.name = 'extra4';
    inputExtra4.value = empresa;
    payuForm.appendChild(inputExtra4);

    // URL de respuesta/confirmación (tu Apps Script)
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkS3hN8NizdZeBMJ6seJhMZ4WEqxj-ZJqXMjP03or67gs5yXiT_osmAm3s9MvUpSfJRA/exec';
    const responseUrl = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
    const confirmationUrl = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
    setValue('responseUrl', responseUrl);
    setValue('confirmationUrl', confirmationUrl);

    // Merchant/Account (por si están en blanco en el HTML)
    const setByName = (name, value) => {
      const el = payuForm.querySelector(`input[name="${name}"]`);
      if (el) el.value = value;
    };
    setByName('merchantId', merchantId);
    setByName('accountId', accountId);

    // Evitar doble envío por doble click
    btnPayu.disabled = true;
    payuForm.submit();
  });
});
