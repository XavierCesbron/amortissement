// --- UTILS ---
const getV = id => document.getElementById(id).value;
const formatC = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

function calculerBase() {
    const mtHT = parseFloat(getV('montantHT')) || 0;
    const vr = parseFloat(getV('valeurResiduelle')) || 0;
    const base = (document.getElementById('isVehicule').checked ? mtHT * 1.2 : mtHT) - vr;
    document.getElementById('resultatBase').innerText = formatC(base);
    return base;
}

function toggleFiscalMan() { document.getElementById('fiscContent').classList.toggle('active'); }

// --- DATES AUTOMATIQUES ---
document.getElementById('dateAcq').addEventListener('input', e => {
    const d = new Date(e.target.value);
    if (isNaN(d.getTime())) return;
    const annee = d.getFullYear();
    document.getElementById('dateService').value = e.target.value;
    document.getElementById('bilanDebut').value = `${annee}-01-01`;
    document.getElementById('bilanFin').value = `${annee}-12-31`;
    calculerBase();
});

// --- VEHICULE TVA ---
document.getElementById('isVehicule').addEventListener('change', e => {
    document.getElementById('co2Box').classList.toggle('hidden', !e.target.checked);
    calculerBase();
});

// --- MODE VARIABLE ---
document.getElementById('typeEco').addEventListener('change', updateVariableFields);
document.getElementById('dureeEco').addEventListener('input', updateVariableFields);

function updateVariableFields() {
    const mode = getV('typeEco');
    const duree = parseInt(getV('dureeEco')) || 0;
    const zone = document.getElementById('zoneVariable');
    zone.innerHTML = '';
    if (mode !== 'variable' || duree <= 0) return;

    let html = '<div class="mt-2 p-2 bg-yellow-50 border rounded space-y-1">';
    html += '<label class="font-bold uppercase text-[9px]">Répartitions annuelles</label>';
    let total = 0;
    for (let i = 1; i <= duree; i++) {
        html += `<input type="number" class="variableField w-full border p-1 rounded mb-1" placeholder="Année ${i}" value="1">`;
    }
    html += '</div>';
    zone.innerHTML = html;
}

// --- CALCUL ---
document.getElementById('btnCalcul').addEventListener('click', () => {
    const base = calculerBase();
    const duree = parseInt(getV('dureeEco')) || 0;
    const mode = getV('typeEco');
    const dateService = new Date(getV('dateService'));
    const dateCession = getV('dateCession') ? new Date(getV('dateCession')) : null;

    let amortissements = [];
    if (mode === 'lineaire') amortissements = amortissementLineaire(base, duree, dateService, dateCession);
    else if (mode === 'degressif') amortissements = amortissementDegressif(base, duree, dateService, dateCession);
    else if (mode === 'variable') amortissements = amortissementVariable(base, duree);

    // Affichage dans console pour test
    console.table(amortissements);
});
