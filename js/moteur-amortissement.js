// moteur-amortissement.js

const getV = (id) => document.getElementById(id).value;
const formatC = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

// Calcul de base comptable ou fiscale
function calculerBase() {
    const mtHT = parseFloat(getV('montantHT')) || 0;
    const vr = parseFloat(getV('valeurResiduelle')) || 0;
    const isVehicule = document.getElementById('isVehicule').checked;
    const baseComptable = (isVehicule ? mtHT * 1.2 : mtHT) - vr;
    const baseFiscale = (isVehicule ? mtHT * 1.2 : mtHT);
    document.getElementById('resultatBase').innerText = formatC(baseComptable);
    return { baseComptable, baseFiscale };
}

// Gestion des dates automatiques
document.getElementById('dateAcq').addEventListener('input', (e) => {
    const d = new Date(e.target.value);
    if (!isNaN(d)) {
        document.getElementById('dateService').value = e.target.value;
        document.getElementById('bilanDebut').value = `${d.getFullYear()}-01-01`;
        document.getElementById('bilanFin').value = `${d.getFullYear()}-12-31`;
    }
    calculerBase();
});

// Affichage / Masquage CO2
document.getElementById('isVehicule').addEventListener('change', (e) => {
    document.getElementById('co2Box').classList.toggle('hidden', !e.target.checked);
    calculerBase();
});

// Fonction utilitaire : différence en jours
function diffJours(date1, date2) {
    return Math.max(0, Math.floor((date2 - date1) / 86400000) + 1);
}

// Fonction utilitaire : différence en mois entiers
function diffMois(dateDebut, dateFin) {
    return Math.max(0, (dateFin.getFullYear() - dateDebut.getFullYear()) * 12 + (dateFin.getMonth() - dateDebut.getMonth()) + 1);
}

// Fonction principale : calcul des amortissements
function calculerAmortissements() {
    const { baseComptable, baseFiscale } = calculerBase();
    const dureeEco = parseInt(getV('dureeEco')) || 5;
    const dureeFisc = parseInt(getV('dureeFisc')) || dureeEco;
    const typeEco = getV('typeEco');
    const typeFisc = getV('typeFisc');
    const hasFisc = document.getElementById('activeFiscal').checked;

    const dServ = new Date(getV('dateService'));
    const dCessInput = getV('dateCession');
    const dCess = dCessInput ? new Date(dCessInput) : null;

    let plan = [];

    let cE = 0, cF = 0;

    for (let i = 0; i < dureeEco + 5; i++) {
        const annee = dServ.getFullYear() + i;
        let dotE = 0, dotF = 0;

        // ----- Linéaire -----
        if (typeEco === 'lineaire') {
            let start = new Date(dServ.getFullYear() + i, 0, 1);
            let end = new Date(dServ.getFullYear() + i, 11, 31);

            if (i === 0) start = dServ; // prorata année 1 sur jours
            if (dCess && annee === dCess.getFullYear()) end = dCess; // prorata cession

            const ratio = diffJours(start, end) / 360;
            dotE = Math.min((baseComptable / dureeEco) * ratio, baseComptable - cE);
        }

        // ----- Dégressif -----
        else if (typeEco === 'degressif') {
            if (dureeEco <= 2) { dotE = baseComptable / dureeEco; } // pas de dégressif
            else {
                let tauxLin = 1 / (dureeEco - i);
                let coeff = (dureeEco === 3) ? 1.5 : (dureeEco === 4 ? 2 : 2.5);
                let tauxDeg = coeff / dureeEco;
                if (i === 0) {
                    const mois = 12 - dServ.getMonth(); // prorata mois entiers année 1
                    dotE = Math.min(baseComptable * tauxDeg * (mois / 12), baseComptable - cE);
                } else {
                    const vnc = baseComptable - cE;
                    if (vnc * tauxDeg > vnc * tauxLin) dotE = vnc * tauxDeg;
                    else dotE = vnc * tauxLin;
                }
            }
        }

        // ----- Variable -----
        else if (typeEco === 'variable') {
            // à compléter si tu veux créer champs dynamiques par année
            // ex: input id="var1", var2...
            dotE = 0; // placeholder
        }

        cE += dotE;

        // Fiscal
        if (hasFisc) {
            if (typeFisc === 'lineaire') {
                let start = new Date(dServ.getFullYear() + i, 0, 1);
                let end = new Date(dServ.getFullYear() + i, 11, 31);
                if (i === 0) start = dServ;
                if (dCess && annee === dCess.getFullYear()) end = dCess;
                const ratio = diffJours(start, end) / 360;
                dotF = Math.min((baseFiscale / dureeFisc) * ratio, baseFiscale - cF);
            } else if (typeFisc === 'degressif') {
                if (dureeFisc <= 2) { dotF = baseFiscale / dureeFisc; } // pas de dégressif
                else {
                    let tauxLin = 1 / (dureeFisc - i);
                    let coeff = (dureeFisc === 3) ? 1.5 : (dureeFisc === 4 ? 2 : 2.5);
                    let tauxDeg = coeff / dureeFisc;
                    if (i === 0) {
                        const mois = 12 - dServ.getMonth();
                        dotF = Math.min(baseFiscale * tauxDeg * (mois / 12), baseFiscale - cF);
                    } else {
                        const vnc = baseFiscale - cF;
                        if (vnc * tauxDeg > vnc * tauxLin) dotF = vnc * tauxLin;
                        else dotF = vnc * tauxLin;
                    }
                }
            }
            cF += dotF;
        } else dotF = dotE;

        plan.push({ annee, dotE, cE, dotF, cF, vnc: baseComptable - cE });
        if (cE >= baseComptable && cF >= baseFiscale) break;
    }

    return plan;
}

// Affichage dans le HTML
function genererTableau() {
    const plan = calculerAmortissements();

    document.getElementById('zoneTableau').classList.remove('hidden');

    let html = `<thead class="bg-slate-800 text-white uppercase text-[10px]"><tr>
        <th>Année</th><th>Dot. Eco</th><th>Dot. Fisc</th><th>VNC</th>
    </tr></thead><tbody>`;

    plan.forEach(r => {
        html += `<tr class="border-b">
            <td>${r.annee}</td>
            <td>${formatC(r.dotE)}</td>
            <td>${formatC(r.dotF)}</td>
            <td class="bg-slate-50">${formatC(r.vnc)}</td>
        </tr>`;
    });

    html += `</tbody>`;
    document.getElementById('tableNormal').innerHTML = html;
}

// Bouton Calculer
document.querySelector('button[onclick="genererTableau()"]').addEventListener('click', genererTableau);
