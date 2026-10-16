
(function () {
    'use strict';

    // ---------- Configuración ----------
    const API_ACTUALIZAR = '/admin/productos-precios/api/actualizar-precios';
    const PRECIO_MIN = 10.00;
    const PRECIO_MAX = 70.00;
    const MSG_RANGO = `El precio debe estar entre S/ ${PRECIO_MIN.toFixed(2)} y S/ ${PRECIO_MAX.toFixed(2)}.`;

    // ---------- Estado ----------
    let modalEditar = null;
    let modalMasivo = null;
    let currentPage = 1;
    let filasTodas = [];
    let filasFiltradas = [];
    let itemsMasivo = [];

    // ---------- Utilidades ----------
    const byId = id => document.getElementById(id);

    const normalizar = s => (s || '').toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim();

    const textoBusqueda = el => normalizar(
        Array.from(el.querySelectorAll('.target-busqueda-nombre, .target-busqueda-insumos'))
            .map(e => e.textContent).join(' ')
    );

    const redondear = n => Math.round((n + Number.EPSILON) * 100) / 100;
    const formatoSoles = n => 'S/ ' + Number(n).toFixed(2);
    const precioValido = n => !isNaN(n) && n >= PRECIO_MIN && n <= PRECIO_MAX;
    const notificar = (msg, tipo) => AppUtils.showNotification(msg, tipo);

    async function enviarActualizaciones(lista) {
        const headers = { 'Content-Type': 'application/json' };
        // Soporte opcional para CSRF (si el layout expone los <meta>)
        const token = document.querySelector('meta[name="_csrf"]')?.content;
        const headerName = document.querySelector('meta[name="_csrf_header"]')?.content;
        if (token && headerName) headers[headerName] = token;

        AppUtils.showLoading(true);
        try {
            const res = await fetch(API_ACTUALIZAR, {
                method: 'POST',
                headers,
                body: JSON.stringify(lista)
            });
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : {};

            if (data.isRateLimit) return false; // el escudo global ya avisa

            if (!res.ok || data.success === false) {
                notificar(data.message || 'No se pudieron actualizar los precios', 'error');
                return false;
            }
            return true;
        } catch (err) {
            console.error('Error al actualizar precios:', err);
            notificar('Fallo de conexión con el servidor', 'error');
            return false;
        } finally {
            AppUtils.showLoading(false);
        }
    }

    // Refleja los nuevos precios en la tabla y en la lista masiva sin recargar
    function aplicarCambiosEnDOM(lista) {
        lista.forEach(({ idProducto, nuevoPrecio }) => {
            const row = byId('prod-row-' + idProducto);
            if (row) {
                row.dataset.precio = nuevoPrecio;
                const celda = row.querySelector('.precio-celda');
                if (celda) celda.textContent = formatoSoles(nuevoPrecio);
            }
            const item = document.querySelector(`.item-masivo[data-id="${idProducto}"]`);
            if (item) {
                item.dataset.precio = nuevoPrecio;
                const precioEl = item.querySelector('.precio-actual');
                if (precioEl) precioEl.textContent = formatoSoles(nuevoPrecio);
            }
        });
    }

    // =====================================================================
    // TABLA: búsqueda + paginación
    // =====================================================================
    function filtrarTabla() {
        const q = normalizar(byId('busqueda').value);
        filasFiltradas = filasTodas.filter(r => r.dataset.busqueda.includes(q));
        currentPage = 1;
        renderTabla();
    }

    function renderTabla() {
        const maxRows = parseInt(byId('maxRows').value, 10) || 10;
        const totalPages = Math.max(1, Math.ceil(filasFiltradas.length / maxRows));
        if (currentPage > totalPages) currentPage = totalPages;

        filasTodas.forEach(r => (r.style.display = 'none'));

        const start = (currentPage - 1) * maxRows;
        filasFiltradas.slice(start, start + maxRows).forEach(r => (r.style.display = ''));

        const filaError = byId('filaSinResultados');
        const sinResultados = filasFiltradas.length === 0;
        if (filaError) filaError.style.display = sinResultados ? '' : 'none';

        renderPaginador(sinResultados ? 0 : totalPages);
    }

    function irAPagina(page) {
        currentPage = page;
        renderTabla();
    }

    function renderPaginador(totalPages) {
        const contenedor = byId('paginadorContenedor');
        if (!contenedor) return;
        contenedor.innerHTML = '';
        if (totalPages === 0) return;

        const crear = (label, page, disabled = false, active = false) => {
            const li = document.createElement('li');
            li.className = 'page-item-jama' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'page-link-jama';
            btn.textContent = label;
            btn.disabled = disabled;
            btn.addEventListener('click', () => irAPagina(page));
            li.appendChild(btn);
            contenedor.appendChild(li);
        };

        crear('Anterior', currentPage - 1, currentPage === 1);
        for (let i = 1; i <= totalPages; i++) crear(String(i), i, false, i === currentPage);
        crear('Siguiente', currentPage + 1, currentPage === totalPages);
    }

    // =====================================================================
    // EDICIÓN INDIVIDUAL
    // =====================================================================
    function editarProducto(id) {
        const row = byId('prod-row-' + id);
        if (!row) return;

        const precio = parseFloat(row.dataset.precio);

        byId('editProdId').value = id;
        byId('editProdNombre').textContent = row.dataset.nombre || '';
        byId('editProdImg').src = row.dataset.imagen || '/img/not-found.png';
        byId('editPrecioActual').textContent = precio.toFixed(2);
        byId('editNuevoPrecio').value = precio.toFixed(2);
        byId('editNuevoPrecio-error').textContent = '';

        modalEditar.show();
    }

    async function guardarPrecioIndividual() {
        const id = Number(byId('editProdId').value);
        const errorEl = byId('editNuevoPrecio-error');
        const nuevo = redondear(parseFloat(byId('editNuevoPrecio').value));
        const row = byId('prod-row-' + id);

        errorEl.textContent = '';

        if (!precioValido(nuevo)) {
            errorEl.textContent = MSG_RANGO;
            return;
        }
        if (row && nuevo === redondear(parseFloat(row.dataset.precio))) {
            errorEl.textContent = 'El nuevo precio es igual al actual.';
            return;
        }

        const lista = [{ idProducto: id, nuevoPrecio: nuevo }];
        if (await enviarActualizaciones(lista)) {
            aplicarCambiosEnDOM(lista);
            notificar('Precio actualizado correctamente', 'success');
            modalEditar.hide();
        }
    }

    // =====================================================================
    // AJUSTE MASIVO
    // =====================================================================
    function calcularNuevoPrecio(actual, tipo, valor) {
        return redondear(tipo === 'FIJAR' ? valor : actual + valor);
    }

    function abrirModalMasivo() {
        byId('masivoTipo').value = 'FIJAR';
        byId('masivoValor').value = '';
        byId('masivoValor-error').textContent = '';
        byId('busquedaMasiva').value = '';
        itemsMasivo.forEach(it => (it.querySelector('.chk-masivo').checked = false));
        actualizarEtiquetaTipo();
        filtrarListaMasiva();
        modalMasivo.show();
    }

    function actualizarEtiquetaTipo() {
        const esFijar = byId('masivoTipo').value === 'FIJAR';
        byId('masivoValorLabel').textContent = esFijar
            ? 'Nuevo precio (S/)'
            : 'Monto a añadir (S/) — negativo para descontar';
        byId('masivoValor').placeholder = esFijar ? '0.00' : '+0.00';
    }

    function filtrarListaMasiva() {
        const q = normalizar(byId('busquedaMasiva').value);
        let visibles = 0;

        itemsMasivo.forEach(it => {
            const coincide = it.dataset.busqueda.includes(q);
            it.classList.toggle('d-none', !coincide);
            if (coincide) visibles++;
        });

        byId('masivoSinResultados').classList.toggle('d-none', visibles !== 0);
        actualizarEstadoMasivo();
    }

    // Contador, "seleccionar todos" y vista previa del nuevo precio
    function actualizarEstadoMasivo() {
        const seleccionados = itemsMasivo.filter(it => it.querySelector('.chk-masivo').checked);
        const visibles = itemsMasivo.filter(it => !it.classList.contains('d-none'));

        byId('masivoContador').textContent = seleccionados.length;
        byId('masivoSelTodos').checked =
            visibles.length > 0 && visibles.every(it => it.querySelector('.chk-masivo').checked);

        const tipo = byId('masivoTipo').value;
        const valor = parseFloat(byId('masivoValor').value);

        itemsMasivo.forEach(it => {
            const previewEl = it.querySelector('.precio-nuevo');
            const marcado = it.querySelector('.chk-masivo').checked;

            if (marcado && !isNaN(valor)) {
                const nuevo = calcularNuevoPrecio(parseFloat(it.dataset.precio), tipo, valor);
                const ok = precioValido(nuevo);
                previewEl.textContent = '→ ' + formatoSoles(nuevo);
                previewEl.className = 'precio-nuevo d-block fw-semibold ' + (ok ? 'text-success' : 'text-danger');
            } else {
                previewEl.textContent = '';
            }
        });
    }

    function seleccionarTodosVisibles(checked) {
        itemsMasivo
            .filter(it => !it.classList.contains('d-none'))
            .forEach(it => (it.querySelector('.chk-masivo').checked = checked));
        actualizarEstadoMasivo();
    }

    async function aplicarAjusteMasivo() {
        const tipo = byId('masivoTipo').value;
        const valor = parseFloat(byId('masivoValor').value);
        const errorEl = byId('masivoValor-error');
        errorEl.textContent = '';

        if (isNaN(valor)) {
            errorEl.textContent = 'Ingresa un valor válido.';
            return;
        }
        if (tipo === 'FIJAR' && !precioValido(valor)) {
            errorEl.textContent = MSG_RANGO;
            return;
        }
        if (tipo === 'SUMAR' && valor === 0) {
            errorEl.textContent = 'El monto a añadir no puede ser 0.';
            return;
        }

        const seleccionados = itemsMasivo.filter(it => it.querySelector('.chk-masivo').checked);
        if (seleccionados.length === 0) {
            notificar('Selecciona al menos un plato', 'error');
            return;
        }

        const lista = [];
        const fueraDeRango = [];

        seleccionados.forEach(it => {
            const actual = redondear(parseFloat(it.dataset.precio));
            const nuevo = calcularNuevoPrecio(actual, tipo, valor);
            const nombre = it.querySelector('.target-busqueda-nombre').textContent.trim();

            if (!precioValido(nuevo)) {
                fueraDeRango.push(nombre);
            } else if (nuevo !== actual) {
                lista.push({ idProducto: Number(it.dataset.id), nuevoPrecio: nuevo });
            }
        });

        if (fueraDeRango.length > 0) {
            const extra = fueraDeRango.length > 3 ? ` y ${fueraDeRango.length - 3} más` : '';
            notificar(
                `El nuevo precio queda fuera de S/ ${PRECIO_MIN.toFixed(2)} - S/ ${PRECIO_MAX.toFixed(2)} en: ` +
                fueraDeRango.slice(0, 3).join(', ') + extra,
                'error'
            );
            return;
        }
        if (lista.length === 0) {
            notificar('Ningún precio cambiaría con este ajuste', 'error');
            return;
        }

        if (await enviarActualizaciones(lista)) {
            aplicarCambiosEnDOM(lista);
            notificar(`${lista.length} precio(s) actualizado(s) correctamente`, 'success');
            modalMasivo.hide();
        }
    }

    // =====================================================================
    // INICIALIZACIÓN
    // =====================================================================
    function init() {
        // Modales
        modalEditar = bootstrap.Modal.getOrCreateInstance(byId('modalEditarPrecio'));
        modalMasivo = bootstrap.Modal.getOrCreateInstance(byId('modalAjusteMasivo'));

        // Tabla
        filasTodas = Array.from(document.querySelectorAll('#tablaProductos tbody .producto-fila'));
        filasTodas.forEach(r => (r.dataset.busqueda = textoBusqueda(r)));
        filasFiltradas = filasTodas.slice();

        byId('busqueda').addEventListener('input', filtrarTabla);
        byId('maxRows').addEventListener('change', () => { currentPage = 1; renderTabla(); });
        renderTabla();

        // Modal individual
        byId('btnGuardarPrecioIndividual').addEventListener('click', guardarPrecioIndividual);
        byId('editNuevoPrecio').addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); guardarPrecioIndividual(); }
        });
        byId('modalEditarPrecio').addEventListener('shown.bs.modal', () => {
            const input = byId('editNuevoPrecio');
            input.focus();
            input.select();
        });

        // Modal masivo
        itemsMasivo = Array.from(document.querySelectorAll('#listaMasiva .item-masivo'));
        itemsMasivo.forEach(it => (it.dataset.busqueda = textoBusqueda(it)));

        byId('busquedaMasiva').addEventListener('input', filtrarListaMasiva);
        byId('masivoTipo').addEventListener('change', () => {
            actualizarEtiquetaTipo();
            actualizarEstadoMasivo();
        });
        byId('masivoValor').addEventListener('input', actualizarEstadoMasivo);
        byId('masivoSelTodos').addEventListener('change', e => seleccionarTodosVisibles(e.target.checked));
        byId('listaMasiva').addEventListener('change', e => {
            if (e.target.classList.contains('chk-masivo')) actualizarEstadoMasivo();
        });
        byId('btnAplicarMasivo').addEventListener('click', aplicarAjusteMasivo);
    }

    // Funciones llamadas desde onclick en el HTML
    window.editarProducto = editarProducto;
    window.abrirModalMasivo = abrirModalMasivo;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();