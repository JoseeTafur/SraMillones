let carrito = [];

document.addEventListener('DOMContentLoaded', () => {
    // Escuchador de búsqueda reactiva en el menú
    const inputBuscador = document.getElementById('buscador');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', filtrarProductos);
    }
});

/**
 * Agrega un plato a la comanda directamente sin consultar stock ni abrir modales.
 */
function abrirModalInsumos(elemento) {
    const id = elemento.getAttribute('data-id');
    const nombre = elemento.getAttribute('data-nombre');
    const precio = parseFloat(elemento.getAttribute('data-precio'));

    agregarAlCarrito(id, nombre, precio);
}

function agregarAlCarrito(id, nombre, precio) {
    carrito.push({
        productoId: id,
        nombre,
        precio,
        cantidad: 1,
        subtotal: precio
    });

    renderizarCarrito();
}

function renderizarCarrito() {
    const container = document.getElementById('lista-items');
    let total = 0;

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 opacity-50">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted mb-2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                <p class="mt-1 mb-0 small fw-bold text-secondary">Comanda vacía</p>
            </div>`;
        document.getElementById('total-monto').innerText = "0.00";
        return;
    }

    let html = '';
    carrito.forEach((item, index) => {
        total += item.subtotal;

        html += `
            <div class="cart-item-premium-row">
                <div class="item-ticket-details">
                    <span class="item-ticket-title text-dark">${item.nombre}</span>
                    <span class="item-ticket-price-unit">1 unidad x S/ ${item.precio.toFixed(2)}</span>
                </div>
                <div class="item-ticket-actions">
                    <span class="item-ticket-total">S/ ${item.subtotal.toFixed(2)}</span>
                    <button type="button" class="btn-trash-ticket" onclick="eliminarItem(${index})" title="Eliminar Renglón">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </div>`;
    });

    container.innerHTML = html;
    document.getElementById('total-monto').innerText = total.toFixed(2);
}

function limpiarBuscadorCarta() {
    const input = document.getElementById('buscador');
    if (input) {
        input.value = '';
        filtrarProductos();
        input.focus();
    }
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

function filtrarProductos() {
    const texto = document.getElementById('buscador').value.toLowerCase().trim();

    document.querySelectorAll('.producto-card-wrapper').forEach(tarjeta => {
        const elNombre = tarjeta.querySelector('.product-title');

        if (elNombre) {
            const nombreTexto = elNombre.innerText.toLowerCase();
            tarjeta.style.display = nombreTexto.includes(texto) ? '' : 'none';
        }
    });
}

function enviarPedido() {
    const urlParams = new URLSearchParams(window.location.search);
    const mesaId = urlParams.get('mesaId');
    const pedidoId = urlParams.get('pedidoId');

    if (carrito.length === 0) {
        AppUtils.showNotification("⚠️ Agrega al menos un producto a la comanda", "warning");
        return;
    }

    AppUtils.showConfirmationDialog({
        title: '¿Enviar Comanda a Cocina?',
        text: `Se mandarán las órdenes activas para la Mesa #${mesaId || 'Salón'}.`,
        icon: 'question',
        confirmButtonColor: '#1B3A2C',
        confirmButtonText: 'Sí, mandar a cocina'
    }, async function() {

        AppUtils.showLoading(true);

        const notaUsuario = document.getElementById('direccion') ? document.getElementById('direccion').value : "";

        const pedido = {
            id: pedidoId ? parseInt(pedidoId) : null,
            cliente: (document.getElementById('cliente') && document.getElementById('cliente').value) || ("Mesa " + (mesaId || "Salón")),
            direccion: notaUsuario,
            listaDetalles: carrito.map(item => ({
                producto: { id: parseInt(item.productoId) },
                cantidad: item.cantidad,
                precioUnitario: item.precio,
                subtotal: item.subtotal
            }))
        };

        try {
            const response = await fetch('/admin/mesero/guardar' + (mesaId ? '?mesaId=' + mesaId : ''), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });

            const resultadoTexto = await response.text();
            AppUtils.showLoading(false);

            if (resultadoTexto === "OK") {
                Swal.fire({
                    icon: 'success',
                    title: '¡Comanda Enviada!',
                    text: 'La orden ha sido distribuida a las estaciones de cocina de La Jama.',
                    confirmButtonColor: '#1B3A2C'
                }).then(() => {
                    if (urlParams.get('embed') === 'true') {
                        window.location.href = '/admin/mesas?embed=true';
                    } else {
                        window.location.href = '/admin/mesas';
                    }
                });
            } else {
                AppUtils.showNotification("Error al procesar el pedido: " + resultadoTexto, "error");
            }
        } catch (error) {
            AppUtils.showLoading(false);
            console.error("Error:", error);
            AppUtils.showNotification("❌ Fallo de conexión con el servidor", "error");
        }
    });
}