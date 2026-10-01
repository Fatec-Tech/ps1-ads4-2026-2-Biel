const API_URL = 'https://pokeapi.co/api/v2/pokemon';

const pokemonGrid = document.getElementById('pokemonGrid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Instância do Modal Bootstrap
const modalElement = document.getElementById('pokemonModal');
const pokemonModal = new bootstrap.Modal(modalElement);
const modalTitle = document.getElementById('pokemonModalTitle');
const modalBody = document.getElementById('pokemonModalBody');

// Função para buscar os detalhes individuais de um Pokémon
async function fetchPokemonData(urlOrName) {
	const url = urlOrName.startsWith('http')
		? urlOrName
		: `${API_URL}/${urlOrName.toLowerCase().trim()}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Pokémon não encontrado');
	}
	return await response.json();
}

// Função para carregar a lista inicial
async function loadInitialPokemon(limit = 20) {
	showLoading(true);
	pokemonGrid.innerHTML = '';

	try {
		const response = await fetch(`${API_URL}?limit=${limit}`);
		const data = await response.json();

		const pokemonPromises = data.results.map((item) =>
			fetchPokemonData(item.url)
		);
		const pokemonList = await Promise.all(pokemonPromises);

		pokemonList.forEach(renderPokemonCard);
	} catch (error) {
		showError('Erro ao carregar a lista de Pokémon.');
		console.error(error);
	} finally {
		showLoading(false);
	}
}

// Renderiza a carta de Pokémon
function renderPokemonCard(pokemon) {
	const imageUrl =
		pokemon.sprites.other['official-artwork'].front_default ||
		pokemon.sprites.front_default;

	const typesBadges = pokemon.types
		.map(
			(t) =>
				`<span class="badge bg-secondary badge-type">${t.type.name}</span>`
		)
		.join('');

	const heightInMeters = (pokemon.height / 10).toFixed(1);
	const weightInKg = (pokemon.weight / 10).toFixed(1);

	const cardHTML = `
        <div class="col">
          <div class="card h-100 shadow-sm pokemon-card border-0" onclick="openPokemonModal('${pokemon.id}')">
            <div class="text-center p-3 bg-white rounded-top">
              <img src="${imageUrl}" class="card-img-top img-fluid" style="max-height: 160px; object-fit: contain;" alt="${pokemon.name}">
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="card-title text-capitalize fw-bold m-0">${pokemon.name}</h5>
                <small class="text-muted">#${String(pokemon.id).padStart(3, '0')}</small>
              </div>
              <div class="mb-3">
                ${typesBadges}
              </div>
              <div class="row text-center border-top pt-2">
                <div class="col-6 border-end">
                  <small class="text-muted d-block">Altura</small>
                  <strong>${heightInMeters} m</strong>
                </div>
                <div class="col-6">
                  <small class="text-muted d-block">Peso</small>
                  <strong>${weightInKg} kg</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

	pokemonGrid.insertAdjacentHTML('beforeend', cardHTML);
}

// Exibe o Modal com as informações detalhadas
async function openPokemonModal(id) {
	// Exibe feedback de carregamento no modal antes de carregar
	modalTitle.textContent = 'Carregando...';
	modalBody.innerHTML = `
		<div class="text-center py-4">
			<div class="spinner-border text-danger" role="status">
				<span class="visually-hidden">Carregando...</span>
			</div>
		</div>
	`;
	pokemonModal.show();

	try {
		const pokemon = await fetchPokemonData(String(id));

		// Define o título do Modal
		modalTitle.textContent = `${pokemon.name} #${String(pokemon.id).padStart(3, '0')}`;

		// Mapeia stats principais (HP, Ataque, Defesa, Velocidade)
		const statsMap = {
			hp: { name: 'HP', class: 'bg-success' },
			attack: { name: 'Ataque', class: 'bg-danger' },
			defense: { name: 'Defesa', class: 'bg-warning' },
			speed: { name: 'Velocidade', class: 'bg-info' }
		};

		const statsHTML = pokemon.stats
			.filter((s) => statsMap[s.stat.name])
			.map((s) => {
				const config = statsMap[s.stat.name];
				const value = s.base_stat;
				const percent = Math.min(100, Math.round((value / 150) * 100)); // Normalizado
				return `
					<div class="mb-2">
						<div class="d-flex justify-content-between mb-1">
							<small class="fw-bold">${config.name}</small>
							<small class="fw-bold">${value}</small>
						</div>
						<div class="progress" style="height: 10px;">
							<div class="progress-bar ${config.class}" role="progressbar" style="width: ${percent}%;" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="150"></div>
						</div>
					</div>
				`;
			})
			.join('');

		// Mapeia Habilidades
		const abilitiesBadges = pokemon.abilities
			.map(
				(a) =>
					`<span class="badge bg-dark me-1 text-capitalize">${a.ability.name}${a.is_hidden ? ' (Oculta)' : ''}</span>`
			)
			.join('');

		// Som (Cry)
		const cryAudio = pokemon.cries?.latest || pokemon.cries?.legacy;
		const audioHTML = cryAudio
			? `<audio controls class="w-100 mt-2">
					<source src="${cryAudio}" type="audio/ogg">
					Seu navegador não suporta áudio.
			   </audio>`
			: `<p class="text-muted small">Áudio não disponível</p>`;

		// Sprites (Normal e Shiny - Frente e Costas)
		const frontDefault = pokemon.sprites.front_default || '';
		const backDefault = pokemon.sprites.back_default || '';
		const frontShiny = pokemon.sprites.front_shiny || '';
		const backShiny = pokemon.sprites.back_shiny || '';

		// Monta o corpo do Modal
		modalBody.innerHTML = `
			<div class="row g-4">
				<!-- Galeria de Sprites -->
				<div class="col-md-6 border-end">
					<h6 class="fw-bold mb-3">Variações de Sprites</h6>
					<div class="row g-2">
						<div class="col-6">
							<div class="sprite-box">
								<img src="${frontDefault}" alt="Normal Frente" />
								<div class="small text-muted mt-1">Normal (Frente)</div>
							</div>
						</div>
						<div class="col-6">
							<div class="sprite-box">
								<img src="${backDefault}" alt="Normal Costas" />
								<div class="small text-muted mt-1">Normal (Costas)</div>
							</div>
						</div>
						<div class="col-6">
							<div class="sprite-box">
								<img src="${frontShiny}" alt="Shiny Frente" />
								<div class="small text-muted mt-1">Shiny (Frente)</div>
							</div>
						</div>
						<div class="col-6">
							<div class="sprite-box">
								<img src="${backShiny}" alt="Shiny Costas" />
								<div class="small text-muted mt-1">Shiny (Costas)</div>
							</div>
						</div>
					</div>

					<h6 class="fw-bold mt-4 mb-2">Voz / Som (Cry)</h6>
					${audioHTML}
				</div>

				<!-- Stats e Habilidades -->
				<div class="col-md-6">
					<h6 class="fw-bold mb-3">Status Base</h6>
					${statsHTML}

					<h6 class="fw-bold mt-4 mb-2">Habilidades</h6>
					<div>${abilitiesBadges}</div>
				</div>
			</div>
		`;
	} catch (error) {
		modalBody.innerHTML = `
			<div class="alert alert-danger text-center" role="alert">
				Não foi possível carregar as informações do Pokémon.
			</div>
		`;
	}
}

// Busca específica por nome ou ID
async function handleSearch() {
	const query = searchInput.value.trim();
	if (!query) {
		loadInitialPokemon();
		return;
	}

	showLoading(true);
	pokemonGrid.innerHTML = '';

	try {
		const pokemon = await fetchPokemonData(query);
		renderPokemonCard(pokemon);
	} catch (error) {
		showError(`Nenhum Pokémon encontrado com o termo "${query}".`);
	} finally {
		showLoading(false);
	}
}

// Utilitários de UI
function showLoading(state) {
	if (state) {
		loading.classList.remove('d-none');
	} else {
		loading.classList.add('d-none');
	}
}

function showError(message) {
	pokemonGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning text-center" role="alert">
            ${message}
          </div>
        </div>
      `;
}

// Eventos
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') handleSearch();
});

// Inicialização
loadInitialPokemon();