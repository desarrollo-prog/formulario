document.addEventListener('DOMContentLoaded', () => {
  // ------------------- FUNCIÓN DE ALERTA MODERNA -------------------
  function mostrarAlerta(mensaje) {
    // Evita duplicar modales
    if (document.querySelector('.alerta-modal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'alerta-modal';
    overlay.innerHTML = `
      <div class="alerta-contenido">
        <p>${mensaje}</p>
        <button id="btnCerrarAlerta">Aceptar</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animación de entrada
    setTimeout(() => overlay.classList.add('visible'), 10);

    document.getElementById('btnCerrarAlerta').addEventListener('click', () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    });
  }

  // ------------------- SLIDER MODERNO (sin recortes) -------------------
  // Estructura esperada en el HTML:
  // <div class="left slider-modern">
  //   <img class="slider-img" src="img/slider1.jpeg" />
  //   <div class="slider-dots">
  //     <button class="dot"></button>...
  //   </div>
  // </div>
  const slider = document.querySelector('.slider-modern');   // contenedor
  const imgEl  = document.querySelector('.slider-img');      // <img> que muestra el slide
  const dots   = document.querySelectorAll('.slider-dots .dot');

  // Rutas de imágenes (sin recortes)
  const slides = [
    'img/slider1.jpeg',
    'img/slider2.png',
    'img/slider1.jpeg'
  ];

  // Pre-carga para evitar parpadeos
  slides.forEach(src => { const i = new Image(); i.src = src; });

  if (slider && imgEl && dots.length === slides.length && slides.length > 0) {
    let index = 0;
    let intervalo;

    function pintar(i) {
      // fade suave
      imgEl.classList.add('is-fading');
      setTimeout(() => {
        imgEl.src = slides[i];
        imgEl.alt = `Slide ${i + 1}`;
        dots.forEach(d => d.classList.remove('active'));
        dots[i].classList.add('active');
        // termina fade
        requestAnimationFrame(() => {
          imgEl.classList.remove('is-fading');
        });
      }, 150);
    }

    function siguiente() {
      index = (index + 1) % slides.length;
      pintar(index);
    }

    function iniciar() {
      intervalo = setInterval(siguiente, 4000);
    }

    function parar() {
      clearInterval(intervalo);
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        parar();
        index = i;
        pintar(index);
        iniciar();
      });
    });

    // Inicial
    imgEl.src = slides[0];
    imgEl.alt = 'Slide 1';
    dots[0].classList.add('active');
    iniciar();
  }

  // ------------------- FORMULARIO -------------------
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

  // Placeholders defensivos
  if (inputNombre)   inputNombre.placeholder   = 'Ingrese su nombre completo';
  if (inputCorreo)   inputCorreo.placeholder   = 'Ingrese su correo electrónico';
  if (inputEmpresa)  inputEmpresa.placeholder  = 'Ingrese el nombre de su empresa';
  if (inputTelefono) inputTelefono.placeholder = 'Ingrese su número de celular';

  function actualizarPrecio() {
    let precio = null;

    if (tipoPersona && tipoPersona.value === 'natural') {
      // Ocultar ubicación
      campoUbicacion?.classList.add('oculto');
      ubicacion?.removeAttribute('required');
      if (ubicacion) ubicacion.value = '';

      // Ocultar Empresa
      campoEmpresa?.classList.add('oculto');
      campoEmpresa?.classList.remove('mostrar');
      inputEmpresa?.removeAttribute('required');
      if (inputEmpresa) inputEmpresa.value = '';

      // Precio persona natural
      precio = 846983;
    } else if (tipoPersona && tipoPersona.value === 'empresa') {
      // Mostrar ubicación
      campoUbicacion?.classList.remove('oculto');
      ubicacion?.setAttribute('required', 'required');

      // Mostrar Empresa
      campoEmpresa?.classList.add('mostrar');
      campoEmpresa?.classList.remove('oculto');
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
  actualizarPrecio();

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
        mostrarAlerta('Por favor, seleccione el tipo de cliente y (si aplica) la ubicación antes de pagar.');
        return;
      }

      // Política de privacidad obligatoria
      const chkPolitica = document.getElementById('politica');
      if (chkPolitica && !chkPolitica.checked) {
        mostrarAlerta('Debes aceptar la política de privacidad para continuar.');
        chkPolitica.focus();
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
        mostrarAlerta('No se pudo inicializar la librería de firma (CryptoJS). Revisa tu conexión.');
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
        mostrarAlerta('Error interno: formulario de pago no disponible.');
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

      // Enviar EMPRESA + TELÉFONO dentro de extra3 como JSON
      const ex3 = document.createElement('input');
      ex3.type = 'hidden';
      ex3.name = 'extra3';
      ex3.value = JSON.stringify({ empresa, telefono });
      payuForm.appendChild(ex3);

      // (Opcional) extra4 = teléfono
      const ex4 = document.createElement('input');
      ex4.type = 'hidden';
      ex4.name = 'extra4';
      ex4.value = telefono;
      payuForm.appendChild(ex4);

      // URLs de respuesta/confirmación (Apps Script)
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzS1RFbdfRCWTOKWlJJjkodAV7figCyCiqtjMsRiYDZ_72eEfw9jxJPt9C_I2CQ9aR9Jg/exec';
      ensureHiddenInput(payuForm, 'responseUrl', 'responseUrl').value =
        `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
      ensureHiddenInput(payuForm, 'confirmationUrl', 'confirmationUrl').value =
        `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;

      // Enviar
      btnPayu.disabled = true;
      payuForm.submit();
    } catch (err) {
      console.error('[PayU] Error en el envío:', err);
      mostrarAlerta('Ocurrió un error al preparar el pago. Revisa la consola para más detalles.');
    }
  });
});
