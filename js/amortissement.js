// ==============================
// UTILITAIRES
// ==============================
const $ = id => document.getElementById(id);
const euro = v => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

function daysBetween(d1, d2) {
    return Math.floor((d2 - d1) / 86400000) + 1;
}

// ==============================
// AUTOMATISMES DE DATES
// ==============================
document.getElementById("dateAcq").addEventListener("change", e => {
    const d = new Date(e.target.value);
    if (isNaN(d)) return;

    const y = d.getFullYear();
    $("dateService").value = e.target.value;
    $("bilanDebut").value = `${y}-01-01`;
    $("bilanFin").value = `${y}-12-31`;
});

// ==============================
// CALCUL PRINCIPAL
// ==============================
function genererTableau() {

    const baseHT = parseFloat($("montantHT").value || 0);
    const valeurResiduelle = parseFloat($("valeurResiduelle").value || 0);
    const isVehicule = $("isVehicule").checked;

    const baseEco = (isVehicule ? baseHT * 1.2 : baseHT) - valeurResiduelle;

    const dAcq = new Date($("dateAcq").value);
    const dServ = new Date($("dateService").value);
    const dDeb = new Date($("bilanDebut").value);
    const dFin = new Date($("bilanFin").value);
    const dCess = $("dateCession").value ? new Date($("dateCession").value) : null;

    const duree = parseInt($("dureeEco").value);

    if (!dAcq || !dServ || !dDeb || !dFin || isNaN(duree)) {
        alert("Dates ou durée manquantes");
        return;
    }

    let lignes = [];
    let cumul = 0;

    for (let i = 0; i < duree + 1; i++) {

        let debut = new Date(dDeb);
        debut.setFullYear(dDeb.getFullYear() + i);

        let fin = new Date(dFin);
        fin.setFullYear(dFin.getFullYear() + i);

        if (dCess && debut > dCess) break;

        let debutCalc = (i === 0) ? dServ : debut;
        let finCalc = dCess && dCess < fin ? dCess : fin;

        let jours = daysBetween(debutCalc, finCalc);
        if (jours <= 0) continue;

        let dot = (baseEco / duree) * (jours / 365);
        dot = Math.min(dot, baseEco - cumul);

        cumul += dot;

        lignes.push({
            annee: debut.getFullYear(),
            dotation: dot,
            cumul: cumul,
            vnc: baseEco - cumul
        });

        if (cumul >= baseEco) break;
    }

    afficherTableau(lignes);
}

// ==============================
// AFFICHAGE
// ==============================
function afficherTableau(data) {

    let html = `
    <thead class="bg-slate-800 text-white">
        <tr>
            <th>Année</th>
            <th>Dotation</th>
            <th>Amort. cumulé</th>
            <th>VNC</th>
        </tr>
    </thead><tbody>`;

    data.forEach(l => {
        html += `
        <tr>
            <td>${l.annee}</td>
            <td>${euro(l.dotation)}</td>
            <td>${euro(l.cumul)}</td>
            <td>${euro(l.vnc)}</td>
        </tr>`;
    });

    html += "</tbody>";

    document.getElementById("tableNormal").innerHTML = html;
    document.getElementById("zoneTableau").classList.remove("hidden");
}
