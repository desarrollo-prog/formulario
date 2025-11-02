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

  // ------------------- SLIDER -------------------
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

  if (inputNombre)   inputNombre.placeholder   = 'Ingrese su nombre completo';
  if (inputCorreo)   inputCorreo.placeholder   = 'Ingrese su correo electrónico';
  if (inputEmpresa)  inputEmpresa.placeholder  = 'Ingrese el nombre de su empresa';
  if (inputTelefono) inputTelefono.placeholder = 'Ingrese su número de celular';

  function actualizarPrecio() {
    let precio = null;

    if (tipoPersona && tipoPersona.value === 'natural') {
      campoUbicacion?.classList.add('oculto');
      ubicacion?.removeAttribute('required');
      campoEmpresa?.classList.add('oculto');
      campoEmpresa?.classList.remove('mostrar');
      inputEmpresa?.removeAttribute('required');
      precio = 846983;
    } else if (tipoPersona && tipoPersona.value === 'empresa') {
      campoUbicacion?.classList.remove('oculto');
      ubicacion?.setAttribute('required', 'required');
      campoEmpresa?.classList.add('mostrar');
      campoEmpresa?.classList.remove('oculto');
      inputEmpresa?.setAttribute('required', 'required');
      if (ubicacion) {
        if (ubicacion.value === 'bogota') precio = 763000;
        else if (ubicacion.value === 'fuera') precio = 769000;
      }
    }

    if (precio !== null) {
      precioTexto.textContent = `Precio: $${precio.toLocaleString('es-CO')}`;
      btnPayu.textContent = `Pagar $${precio.toLocaleString('es-CO')} con PayU (Sandbox)`;
      btnPayu.dataset.valor = String(precio);
    } else {
      precioTexto.textContent = '';
      btnPayu.textContent = 'Pagar con PayU (Sandbox)';
      btnPayu.dataset.valor = '';
    }
  }

  tipoPersona?.addEventListener('change', actualizarPrecio);
  ubicacion?.addEventListener('change', actualizarPrecio);
  actualizarPrecio();

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

      const chkPolitica = document.getElementById('politica');
      if (chkPolitica && !chkPolitica.checked) {
        mostrarAlerta('Debes aceptar la política de privacidad para continuar.');
        chkPolitica.focus();
        return;
      }

      const form = document.getElementById('formulario');
      if (form && !form.reportValidity()) return;

      const formData = new FormData(form);
      const empresa   = (formData.get('empresa')  || '').toString();
      const correo    = (formData.get('correo')   || '').toString();
      const telefono  = (formData.get('telefono') || '').toString();
      const tipo      = tipoPersona?.value || '';
      const ubi       = ubicacion?.value || 'N/A';
      const vendedor  = inputVendedor?.value || 'sin_vendedor';

      if (typeof CryptoJS === 'undefined' || !CryptoJS.MD5) {
        mostrarAlerta('No se pudo inicializar la librería de firma (CryptoJS). Revisa tu conexión.');
        return;
      }

      const apiKey = '4Vj8eK4rloUd272L48hsrarnUA';
      const merchantId = '508029';
      const accountId = '512321';
      const currency = 'COP';
      const referenceCode = `CJI_${Date.now()}_${vendedor}`;
      const amount = String(valor);
      const rawSignature = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
      const signature = CryptoJS.MD5(rawSignature).toString();

      const payuForm = document.getElementById('formPayu');
      if (!payuForm) {
        mostrarAlerta('Error interno: formulario de pago no disponible.');
        return;
      }

      payuForm.setAttribute('method', 'POST');
      payuForm.setAttribute('action', 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/');
      payuForm.setAttribute('target', '_top');

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

      ['extra3', 'extra4'].forEach((name) => {
        payuForm.querySelectorAll(`input[name="${name}"]`).forEach((el) => el.remove());
      });

      const ex3 = document.createElement('input');
      ex3.type = 'hidden';
      ex3.name = 'extra3';
      ex3.value = JSON.stringify({ empresa, telefono });
      payuForm.appendChild(ex3);

      const ex4 = document.createElement('input');
      ex4.type = 'hidden';
      ex4.name = 'extra4';
      ex4.value = telefono;
      payuForm.appendChild(ex4);

      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzS1RFbdfRCWTOKWlJJjkodAV7figCyCiqtjMsRiYDZ_72eEfw9jxJPt9C_I2CQ9aR9Jg/exec';
      ensureHiddenInput(payuForm, 'responseUrl', 'responseUrl').value = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;
      ensureHiddenInput(payuForm, 'confirmationUrl', 'confirmationUrl').value = `${APPS_SCRIPT_URL}?vendedor=${encodeURIComponent(vendedor)}`;

      btnPayu.disabled = true;
      payuForm.submit();
    } catch (err) {
      console.error('[PayU] Error en el envío:', err);
      mostrarAlerta('Ocurrió un error al preparar el pago. Revisa la consola para más detalles.');
    }
  });
});

