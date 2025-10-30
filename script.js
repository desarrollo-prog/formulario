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
  const tipoPersona    = document.getElementById('tipoPersona');
  const ubicacion      = document.getElementById('ubicacion');
  const campoUbicacion = document.getElementById('campoUbicacion');
  const campoEmpresa   = document.getElementById('campoEmpresa');
  const precioTexto    = document.getElementById('precio');
  const btnPayu        = document.getElementById('btnPayu');

  const inputNombre    = document.getElementById('nombre');
  const inputCorreo    = document.getElementById('correo');
  const inputEmpresa   = document.getElementById('empresa');
  const inputTelefono  = document.getElementById('telefono');

  // Placeholders (por si el HTML no los trae)
  if (inputNombre)   inputNombre.placeholder   = 'Ingrese su nombre completo';
  if (inputCorreo)   inputCorreo.placeholder   = 'Ingrese su correo electrónico';
  if (inputEmpresa)  inputEmpresa.placeholder  = 'Ingrese el nombre de su empresa';
  if (inputTelefono) inputTelefono.placeholder = 'Ingrese su número de celular';

  // ------------------- PRECIO / VISIBILIDAD -------------------
  function actualizarPrecio() {
    let precio = null;

    if (tipoPersona && tipoPersona.value === 'natural') {
      // Ocultar ubicación
      campoUbicacion?.classList.add('oculto');
      ubicacion?.removeAttribute('required');
      if (ubicacion) ubicacion.value = '';

      // Ocultar Empresa (quita .mostrar y pone .oculto)
      campoEmpresa?.classList.remove('mostrar');
      campoEmpresa?.classList.add('oculto');
      inputEmpresa?.removeAttribute('required');
      if (inputEmpresa) inputEmpresa.value = '';

      // Precio persona natural
      precio = 846983;
    } else if (tipoPersona && tipoPersona.value === 'empresa') {
      // Mostrar ubicación
      campoUbicacion?.classList.remove('oculto');
      ubicacion?.setAttribute('required', 'required');

      // Mostrar Empresa (quita .oculto y pone .mostrar)
      campoEmpresa?.classList.remove('oculto');
      campoEmpresa?.classList.add('mostrar');
      inputEmpresa?.setAttribute('required', 'required');

      // Precio según ubicación
      if (ubicacion) {
        if (ubicacion.value === 'bogota') precio = 763000;
        else if (ubicacion.value === 'fuera') precio = 769000;
      }
    }

    // Pintar precio y dataset del botón
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

  // ------------------- UTIL: asegurar inputs en el form PayU -------------------
  function ensureHiddenInput(form, name, idOpt) {
    let el = idOpt ? document.getElementById(idOpt) : form.querySelector(`input[name="${name}"]`);
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      if (idOpt) el.id = idOpt;
      form.appendChild(el);
    }
    return el;
  }

  // ------------------- PAGO PAYU -------------------
  btnPayu?.addEventListener('click', () => {
    try {
      const valor = btnPayu.dataset.valor;
      if (!valor) {
        alert('Por favor, seleccione el tipo de cliente y (si aplica) la ubicación antes de pagar.');
        return;
      }

      // Validación nativa del formulario
      const form = document.getElementById('formulario');
      if (form && !form.reportValidity()) return;

      const formData = new FormData(form);
      const empresa   = (formData.get('empresa')  || '').toString();
      const correo    = (formData.get('correo')   || '').toString();
      const telefono  = (formData.get('telefono') || '').toString();
      const tipo      = tipoPersona?.value || '';
      const ubi       = ubicacion?.value || 'N/A';
      const vendedor  = inputVendedor?.value || 'sin_vendedor';

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
      const amount = String(valor); // sin formato local

      // Firma
      const rawSignature = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
      const signature = CryptoJS.MD5(rawSignature).toString();

      // ---- Form que se envía a PayU ----
      const payuForm = document.getElementById('formPayu');
      if (!payuForm) {
        alert('Error interno: formulario de pago no disponible.');
        return;
      }

      // Configuración del form
      payuForm.setAttribute('method', 'POST');
      payuForm.setAttribute('action', 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/');
      payuForm.setAttribute('target', '_top');

      // Asegurar y setear campos ocultos requeridos
      ensureHiddenInput(payuForm, 'merchantId').value = merchantId;
      ensureHiddenInput(payuForm, 'accountId').value = accountId;
      ensureHiddenInput(payuForm, 'description').value = 'Pago de formulario CJI';
      ensureHiddenInput(payuForm, 'referenceCode', 'referenceCode').value = referenceCode;
      ensureHiddenInput(payuForm, 'amount', 'amount').value = amount;
      ensureHiddenInput(payuForm, 'tax').value = '0';
      ensureHiddenInput(payuForm, 'taxReturnBase').value = '0';
      ensureHiddenInput(payuForm, 'currency').value = currency;
      ensureHiddenInput(payuForm, 'signature', 'signature').value = signature;
      ensureHiddenInput(payuForm, 'buyerEmail', 'buyerEmail').value = correo;
      ensureHiddenInput(payuForm, 'extra1', 'extra1').value = tipo;
      ensureHiddenInput(payuForm, 'extra2', 'extra2').value = ubi;

      // Limpiar duplicados previos y setear extras
      ['extra3', 'extra4'].forEach((name) => {
        payuForm.querySelectorAll(`input[name="${name}"]`).forEach((el) => el.remove());
      });

      // *** IMPORTANTE ***
      // Enviar EMPRESA + TELÉFONO dentro de extra3 como JSON (confiable)
      const ex3 = document.createElement('input');
      ex3.type = 'hidden';
      ex3.name = 'extra3';
      ex3.value = JSON.stringify({ empresa, telefono }); // 👈 ambos aquí
      payuForm.appendChild(ex3);

      // (Opcional) extra4 = teléfono (por si llega, pero no dependemos de él)
      const ex4 = document.createElement('input');
      ex4.type = 'hidden';
      ex4.name = 'extra4';
      ex4.value = telefono;
      payuForm.appendChild(ex4);

      // URLs de respuesta/confirmación (Apps Script) — usa tu endpoint actual
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzS1RFbdfRCWTOKWlJJjkodAV7figCyCiqtjMsRiYDZ_72eEfw9jxJPt9C_I2CQ9aR9Jg/exec';
      ensureHiddenInput(payuForm, 'responseUrl', 'responseUrl').value = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
      ensureHiddenInput(payuForm, 'confirmationUrl', 'confirmationUrl').value = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;

      // Enviar
      btnPayu.disabled = true;
      payuForm.submit();
    } catch (err) {
      console.error('[PayU] Error en el envío:', err);
      alert('Ocurrió un error al preparar el pago. Revisa la consola para más detalles.');
    }
  });
});
