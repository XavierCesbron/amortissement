// --- UTILITAIRES ---
const getVal = (id) => document.getElementById(id).value;
const formatC = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

// --- CHAMPS VARIABLES ---
const dureeInput = document.getElementById('dureeEco');
const zoneVariable = document.getElementById('zoneVariable');

function majChampsVariable() {
    const duree = parseInt(dureeInput.value) || 0;
    zoneVariable.innerHTML = '';
    for (let i = 0; i < duree; i++) {
        const div = document.createElement('div');
        div.innerHTML = `<label>Année ${i + 1} :</label><input type="number" class="valVariable" value="1" style="width:50px;">`;
        zoneVariable.appendChild(div);
    }
}

// --- CALCUL ---
function calculer() {
    const base = parseFloat(getVal('montantHT')) || 0;
    const vr = parseFloat(getVal('valeurResiduelle')) || 0;
    const isVehicule = document.getElementById('isVehicule').checked;
    const baseCompta = (isVehicule ? base * 1.2 : base) - vr;
    const baseFiscal = isVehicule ? base * 1.2 : base;

    const mode = document.getElementById('typeEco').value;
    const duree = parseInt(dureeInput.value) || 1;

    const dDebut = new Date(getVal('dateService'));
    const dCession = getVal('dateCession') ? new Date(getVal('dateCession')) : null;

    let amortis = [];
    if (mode === 'lineaire') amortis = amortissementLineaire(baseCompta, duree, dDebut, dCession);
    else if (mode === 'degressif') amortis = amortissementDegressif(baseCompta, duree, dDebut, dCession);
    else if (mode === 'variable') {
        const vals = Array.from(document.querySelectorAll('.valVariable')).map(e => parseFloat(e.value) || 0);
        amortis = amortissementVariable(baseCompta, vals);
    }

    // affichage console (ou tableau HTML)
    console.log(amortis.map(v => formatC(v)));
}

// --- EVENT ---
document.getElementById('btnCalcul').addEventListener('click', calculer);
dureeInput.addEventListener('input', majChampsVariable);
document.getElementById('typeEco').addEventListener('change', majChampsVariable);
