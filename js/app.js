/* =========================================================
   La Lechona Colombiana — lógica del menú, carrito y reservas
   ========================================================= */

/* ===== 1. DATOS DEL NEGOCIO: cambia estos valores ===== */
const NEGOCIO = {
  whatsapp: '573000000000',          // Tu WhatsApp con 57 adelante, sin espacios ni +
  telefonoVisible: '[NÚMERO]',       // Como quieres que se vea en la página
  direccion: '[DIRECCIÓN], Villavicencio, Meta',
  domicilio: 4000,                   // Valor del domicilio en pesos
  nequi: '[NÚMERO NEQUI]',
  daviplata: '[NÚMERO DAVIPLATA]',
  linkPago: ''                       // Link de Wompi / Mercado Pago (opcional)
};

/* ===== 2. MENÚ: agrega, quita o cambia productos aquí ===== */
const MENU = [
  { id: 'personal', nombre: 'Lechona Personal', descripcion: 'Porción individual con arepa, papa y ají.', precio: 18000, imagen: 'img/lechona-personal.jpg' },
  { id: 'familiar', nombre: 'Lechona Familiar', descripcion: 'Ideal para compartir en familia.', precio: 45000, imagen: 'img/lechona-familiar.jpg' },
  { id: 'acompanamientos', nombre: 'Acompañamientos', descripcion: 'Arepa, papa, patacón y ají casero.', precio: 5000, imagen: 'img/acompanamientos.jpg', opciones: ['Arepa', 'Papa', 'Patacón'] },
  { id: 'bebidas', nombre: 'Bebidas', descripcion: 'Gaseosas, jugos naturales y más.', precio: 3800, imagen: 'img/bebidas.jpg', opciones: ['Gaseosa', 'Jugo natural'] }
];

/* ===== 3. Lógica (no necesitas cambiar nada de aquí hacia abajo) ===== */
const $ = (selector) => document.querySelector(selector);
const pesos = (n) => '$ ' + n.toLocaleString('es-CO');
const urlWhatsapp = (texto) => 'https://wa.me/' + NEGOCIO.whatsapp + '?text=' + encodeURIComponent(texto);

let carrito = {};       // clave -> { id, opcion, cantidad }
let paso = 1;
const opcionElegida = {};

try { carrito = JSON.parse(localStorage.getItem('lechona-carrito')) || {}; } catch (e) { carrito = {}; }
function guardarCarrito() { try { localStorage.setItem('lechona-carrito', JSON.stringify(carrito)); } catch (e) {} }

function cantidadDe(id) {
  return Object.values(carrito).filter((p) => p.id === id).reduce((suma, p) => suma + p.cantidad, 0);
}

function pintarMenu() {
  $('#tarjetas').innerHTML = MENU.map((p) => {
    if (p.opciones && !opcionElegida[p.id]) opcionElegida[p.id] = p.opciones[0];
    const opciones = p.opciones
      ? `<div class="opciones" role="group" aria-label="Opciones de ${p.nombre}">${p.opciones.map((o) =>
          `<button class="opcion" type="button" data-opcion="${p.id}" data-valor="${o}" aria-pressed="${opcionElegida[p.id] === o}">${o}</button>`).join('')}</div>`
      : '';
    const n = cantidadDe(p.id);
    return `
      <article class="tarjeta">
        <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
        <div class="tarjeta__cuerpo">
          <h3>${p.nombre}</h3>
          <p>${p.descripcion}</p>
          ${opciones}
          <span class="tarjeta__precio">${pesos(p.precio)}</span>
          <span class="tarjeta__cantidad">${n ? n + ' en tu pedido' : ''}</span>
          <button class="boton boton--rojo" type="button" data-agregar="${p.id}">Agregar</button>
        </div>
      </article>`;
  }).join('');
}

function lineas() {
  return Object.entries(carrito).map(([clave, item]) => {
    const p = MENU.find((m) => m.id === item.id);
    return p ? { clave, p, opcion: item.opcion, cantidad: item.cantidad, total: p.precio * item.cantidad } : null;
  }).filter(Boolean);
}

function totales() {
  const ls = lineas();
  const subtotal = ls.reduce((s, l) => s + l.total, 0);
  const domicilio = subtotal > 0 ? NEGOCIO.domicilio : 0;
  return { subtotal, domicilio, total: subtotal + domicilio, unidades: ls.reduce((s, l) => s + l.cantidad, 0) };
}

function pintarCarrito() {
  const ls = lineas();
  const t = totales();
  document.querySelectorAll('[data-contador]').forEach((el) => { el.textContent = t.unidades; el.hidden = t.unidades === 0; });
  $('#flotante').hidden = t.unidades === 0;
  $('#flotanteTexto').textContent = 'Ver pedido · ' + pesos(t.total);
  $('#subtotal').textContent = pesos(t.subtotal);
  $('#domicilio').textContent = pesos(t.domicilio);
  $('#total').textContent = pesos(t.total);

  $('#paso1').innerHTML = ls.length
    ? ls.map((l) => `
        <div class="producto">
          <img src="${l.p.imagen}" alt="">
          <div><b>${l.p.nombre}${l.opcion ? ' · ' + l.opcion : ''}</b><small>${pesos(l.p.precio)} c/u · ${pesos(l.total)}</small></div>
          <div class="cantidad">
            <button type="button" data-menos="${l.clave}" aria-label="Quitar uno">−</button>
            <output>${l.cantidad}</output>
            <button type="button" data-mas="${l.clave}" aria-label="Agregar uno">+</button>
          </div>
        </div>`).join('')
    : `<div class="vacio"><b>Tu pedido está vacío</b><span>Agrega lechona, acompañamientos o bebidas desde el menú.</span><a class="boton boton--borde" href="#menu" data-cerrar>Ver menú</a></div>`;

  $('#seguir').disabled = paso === 1 && ls.length === 0;
  if (paso === 2) $('#seguir').textContent = 'Confirmar pedido · ' + pesos(t.total);
}

function irAlPaso(n) {
  paso = n;
  $('#paso1').hidden = n !== 1;
  $('#paso2').hidden = n !== 2;
  $('#paso3').hidden = n !== 3;
  $('#atras').hidden = n !== 2;
  $('#carritoPie').hidden = n === 3;
  $('#seguir').textContent = 'Continuar con la entrega';
  $('#carritoTitulo').textContent = ['', 'Tu pedido', 'Entrega y pago', 'Confirmación'][n];
  document.querySelectorAll('.pasos span').forEach((s) => s.classList.toggle('activo', Number(s.dataset.paso) <= n));
  pintarCarrito();
}

function abrirCarrito() { $('#carrito').hidden = false; $('#velo').hidden = false; irAlPaso(paso); $('#cerrarCarrito').focus(); }
function cerrarCarrito() { $('#carrito').hidden = true; $('#velo').hidden = true; }

function confirmarPedido() {
  const v = (id) => $('#' + id).value.trim();
  const faltan = [['nombre', 'tu nombre'], ['tel', 'tu celular'], ['barrio', 'el barrio'], ['dir', 'la dirección']]
    .filter(([id]) => !v(id)).map(([, texto]) => texto);
  if (faltan.length) { mostrarError('Falta ' + faltan.join(', ') + '.'); return; }
  if (v('tel').replace(/\D/g, '').length < 10) { mostrarError('Revisa el celular: debe tener 10 dígitos.'); return; }
  $('#error').hidden = true;

  const pago = document.querySelector('input[name="pago"]:checked').value;
  const t = totales();
  const numero = 'LC-' + Date.now().toString().slice(-6);
  const detalle = lineas().map((l) => `• ${l.cantidad} x ${l.p.nombre}${l.opcion ? ' (' + l.opcion + ')' : ''} — ${pesos(l.total)}`).join('\n');
  const mensaje =
`Hola, quiero hacer un pedido
Pedido: ${numero}

${detalle}

Subtotal: ${pesos(t.subtotal)}
Domicilio: ${pesos(t.domicilio)}
TOTAL: ${pesos(t.total)}

Nombre: ${v('nombre')}
Celular: ${v('tel')}
Barrio: ${v('barrio')}
Dirección: ${v('dir')}, Villavicencio${v('notas') ? '\nIndicaciones: ' + v('notas') : ''}
Pago: ${pago}`;

  $('#numeroPedido').textContent = numero;
  $('#resumen').textContent = mensaje;
  $('#enlaceWhatsapp').href = urlWhatsapp(mensaje);

  if (pago.startsWith('Nequi')) {
    $('#instruccionPago').innerHTML = `Transfiere <b>${pesos(t.total)}</b> a Nequi <code>${NEGOCIO.nequi}</code> o Daviplata <code>${NEGOCIO.daviplata}</code> y envía el comprobante en el chat.`;
  } else if (pago.startsWith('Tarjeta')) {
    $('#instruccionPago').innerHTML = NEGOCIO.linkPago
      ? `Paga <b>${pesos(t.total)}</b> con tarjeta o PSE aquí: <a href="${NEGOCIO.linkPago}" target="_blank" rel="noopener">ir al pago seguro</a>.`
      : `Te enviaremos por WhatsApp un link de pago seguro por <b>${pesos(t.total)}</b>.`;
  } else {
    $('#instruccionPago').innerHTML = `Ten listos <b>${pesos(t.total)}</b> en efectivo para el domiciliario. Si necesitas cambio, dinos de cuánto.`;
  }
  irAlPaso(3);
}

function mostrarError(texto) { $('#error').textContent = texto; $('#error').hidden = false; }

/* ----- Eventos ----- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('button, a');
  if (!el) return;

  if (el.hasAttribute('data-abrir-carrito')) abrirCarrito();
  else if (el.dataset.opcion) { opcionElegida[el.dataset.opcion] = el.dataset.valor; pintarMenu(); }
  else if (el.dataset.agregar) {
    const p = MENU.find((m) => m.id === el.dataset.agregar);
    const opcion = p.opciones ? opcionElegida[p.id] : '';
    const clave = p.id + (opcion ? '|' + opcion : '');
    carrito[clave] = { id: p.id, opcion, cantidad: (carrito[clave]?.cantidad || 0) + 1 };
    guardarCarrito(); pintarCarrito(); pintarMenu();
    const boton = document.querySelector(`[data-agregar="${p.id}"]`);
    if (boton) {
      boton.textContent = 'Agregado ✓'; boton.classList.add('agregado');
      setTimeout(() => { boton.textContent = 'Agregar'; boton.classList.remove('agregado'); }, 1100);
    }
  }
  else if (el.dataset.mas) { carrito[el.dataset.mas].cantidad++; guardarCarrito(); pintarCarrito(); pintarMenu(); }
  else if (el.dataset.menos) {
    const clave = el.dataset.menos;
    if (--carrito[clave].cantidad <= 0) delete carrito[clave];
    guardarCarrito(); pintarCarrito(); pintarMenu();
  }
  else if (el.hasAttribute('data-cerrar')) cerrarCarrito();
});

$('#abrirCarrito').addEventListener('click', abrirCarrito);
$('#cerrarCarrito').addEventListener('click', cerrarCarrito);
$('#velo').addEventListener('click', cerrarCarrito);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#carrito').hidden) cerrarCarrito(); });
$('#seguir').addEventListener('click', () => { if (paso === 1 && lineas().length) irAlPaso(2); else if (paso === 2) confirmarPedido(); });
$('#atras').addEventListener('click', () => irAlPaso(1));
$('#paso2').addEventListener('submit', (e) => { e.preventDefault(); confirmarPedido(); });
$('#nuevoPedido').addEventListener('click', () => { carrito = {}; guardarCarrito(); irAlPaso(1); pintarMenu(); cerrarCarrito(); });

/* ----- Reservas: arma el mensaje y lo envía por WhatsApp ----- */
$('#rFecha').min = new Date().toISOString().slice(0, 10);
$('#formReserva').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = (id) => $('#' + id).value.trim();
  const msg = $('#msgReserva');
  const faltan = [['rNombre', 'nombre'], ['rTel', 'celular'], ['rFecha', 'fecha'], ['rHora', 'hora'], ['rPersonas', 'número de personas']]
    .filter(([id]) => !v(id)).map(([, t]) => t);
  if (faltan.length) { msg.textContent = 'Completa: ' + faltan.join(', ') + '.'; msg.hidden = false; return; }
  const fecha = new Date(v('rFecha') + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const texto = `Hola, quiero reservar una mesa.\nNombre: ${v('rNombre')}\nCelular: ${v('rTel')}\nFecha: ${fecha}\nHora: ${v('rHora')}\nPersonas: ${v('rPersonas')}`;
  msg.innerHTML = `Reserva lista para el ${fecha} a las ${v('rHora')}. <a href="${urlWhatsapp(texto)}" target="_blank" rel="noopener">Confírmala por WhatsApp</a> y te respondemos con la disponibilidad.`;
  msg.hidden = false;
});

/* ----- Datos de contacto en la página ----- */
document.querySelectorAll('[data-telefono]').forEach((el) => { el.textContent = NEGOCIO.telefonoVisible; });
document.querySelectorAll('[data-direccion]').forEach((el) => { el.textContent = NEGOCIO.direccion; });

pintarMenu();
irAlPaso(1);
