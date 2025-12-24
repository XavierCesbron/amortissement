// Helper pour récupérer un élément par id
const d = id => document.getElementById(id);

// Conversion en euro (fonction ASCII sûre)
const euro = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

// Calcul prorata en base 360
function prorata(dateDebut, dateFin){
    const jours = (dateFin - dateDebut) / 86400000 + 1;
    return jours / 360;
}

// Recalcul automatique de la base amortissable
function recalculerBase(){
    let base = parseFloat(d('montantHT')?.value) || 0;
    if(d('isVehicule')?.checked) base *= 1.2;
    base -= parseFloat(d('valeurResiduelle')?.value) || 0;
    d('resultatBase').innerText = euro(base);
    return base;
}

// Génération du tableau d'amortissement simple
function genererTableau(){
    const base = recalculerBase();
    const durE = parseInt(d('dureeEco')?.value) || 5;

    const dateServ = new Date(d('dateService')?.value);
    const dateDebut = new Date(d('bilanDebut')?.value);
    const dateFin = new Date(d('bilanFin')?.value);

    let cumul = 0;
    let html = `<thead><tr><th>Année</th><th>Dotation</th><th>Cumul</th><th>VNC</th></tr></thead><tbody>`;

    for(let i = 0; i < durE; i++){
        let dot = base / durE;
        if(i === 0 && dateServ > dateDebut) dot *= prorata(dateServ, dateFin);
        if(i === durE - 1) dot = base - cumul; // dernière année pour ajuster arrondi
        cumul += dot;
        html += `<tr>
            <td>${dateDebut.getFullYear()+i}</td>
            <td>${euro(dot)}</td>
            <td>${euro(cumul)}</td>
            <td>${euro(base - cumul)}</td>
        </tr>`;
    }

    d('tableNormal').innerHTML = html;
}

// Gestion du bouton calcul
d('btnCalculer')?.addEventListener('click', genererTableau);

// Auto remplissage des dates après acquisition
d('dateAcq')?.addEventListener('change', e => {
    const y = new Date(e.target.value).getFullYear();
    d('dateService').value = e.target.value;
    d('bilanDebut').value = `${y}-01-01`;
    d('bilanFin').value = `${y}-12-31`;
    recalculerBase();
});

// Recalculer automatiquement quand les champs changent
['montantHT','valeurResiduelle','isVehicule'].forEach(id => {
    d(id)?.addEventListener('input', recalculerBase);
});
