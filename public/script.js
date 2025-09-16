// Script principal para la interaccion frontend

// Elementos del DOM
const form = document.getElementById('concept-form');
const nameInput = document.getElementById('name');
const descInput = document.getElementById('description');
const listEl = document.getElementById('concept-list');
const refreshBtn = document.getElementById('refresh');
const deleteAllBtn = document.getElementById('delete-all');

// URL base de la API
const API_BASE = '/api/concepts';

//Muestra el detalle de un concepto dentro de su elemento de lista.
async function showDetail(id, li) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) {
      // Si no se encuentra el concepto, muestra error
      li.querySelector('.detail-box')?.remove();
      const errorDiv = document.createElement('div');
      errorDiv.className = 'detail-box error';
      errorDiv.textContent = 'No se encontró el concepto';
      li.appendChild(errorDiv);
      return;
    }
    const item = await res.json();

    // Elimina cualquier detalle anterior en este elemento
    li.querySelector('.detail-box')?.remove();

    // Crea y muestra el detalle
    const detailDiv = document.createElement('div');
    detailDiv.className = 'detail-box';
    detailDiv.innerHTML = `
      <h3>Detalle</h3>
      <strong>${item.name}</strong>
      <p>${item.description}</p>
      <div class="small">ID: ${item.id}</div>
      <button class="close-detail">Cerrar</button>
    `;
    li.appendChild(detailDiv);

    // Botón para cerrar el detalle
    detailDiv.querySelector('.close-detail').onclick = () => {
      detailDiv.remove();
    };
  } catch (err) {
    // Error al obtener el detalle
    li.querySelector('.detail-box')?.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'detail-box error';
    errorDiv.textContent = 'Error al obtener detalle';
    li.appendChild(errorDiv);
  }
}

//Obtiene la lista de conceptos y la muestra en la vista.
//Agrega los botones de "Ver detalle" y "Eliminar" a cada concepto.

async function fetchAndRender() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    listEl.innerHTML = '';

    // Si no hay conceptos, muestra mensaje
    if (data.length === 0) {
      listEl.innerHTML = '<li class="small">No hay conceptos guardados.</li>';
      return;
    }

    // Renderiza cada concepto en la lista
    data.forEach(item => {
      const li = document.createElement('li');
      li.className = 'concept-item';
      li.innerHTML = `
        <strong>${item.name}</strong>
        <div>
          <button data-id="${item.id}" class="detail-btn">Ver detalle</button>
          <button data-id="${item.id}" class="delete-btn">Eliminar</button>
        </div>
      `;
      listEl.appendChild(li);

      // Evento para eliminar concepto
      li.querySelector('.delete-btn').addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        fetchAndRender();
      });

      // Evento para mostrar detalle
      li.querySelector('.detail-btn').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        showDetail(id, li);
      });
    });
  } catch (err) {
    console.error('Error al obtener conceptos', err);
  }
}


//Evento para agregar un nuevo concepto desde el formulario.

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  // Validación de campos
  if (!name || !description) return alert('Completar ambos campos');

  // Envía el nuevo concepto al backend
  await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });

  // Limpia el formulario y actualiza la lista
  nameInput.value = '';
  descInput.value = '';
  fetchAndRender();
});

// Evento para refrescar la lista manualmente
refreshBtn.addEventListener('click', fetchAndRender);


//Evento para eliminar todos los conceptos.

deleteAllBtn.addEventListener('click', async () => {
  if (!confirm('¿Eliminar todos los conceptos?')) return;
  await fetch(API_BASE, { method: 'DELETE' });
  fetchAndRender();
});

// Renderiza la lista al cargar la página
fetchAndRender();
