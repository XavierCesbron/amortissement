const d = id => document.getElementById(id);
const euro = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

// ------------------ DATE AUTO ------------------
d('dateAcq').addEventListener('input', e => {
    const date = e.target.value;
    d('dateService').value = date;
    if(date){
        const an = new Date(date).getFullYear();
        d('bilanDebut').value = `${an}-01-01`;
        d('bilanFin').value = `${an}-12-31`;
    }
    recalculerBase();
});

// ------------------ BASE ------------------
function recalculerBase(){
    let base = parseFloat(d('montantHT').value) || 0;
    base -= parseFloat(d('valeurResiduelle').value) || 0;
    d('resultatBase').innerText = euro(base);
    return base;
}

// ------------------ VARIABLE ------------------
d('typeEco').addEventListener('change', e => {
    const container = d('variableInputs');
    container.innerHTML = '';
    d('totalVariableContainer').classList.toggle('hidden', e.target.value !== 'variable');
    const duree = parseInt(d('dureeEco').value) || 5;
    if(e.target.value === 'variable'){
        container.classList.remove('hidden');
        for(let i=1;i<=duree;i++){
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'border p-1 rounded w-20';
            input.value = 0;
            input.dataset.annee = i;
            input.addEventListener('input', majTotalVariable);
            container.appendChild(document.createTextNode(`Année ${i}: `));
            container.appendChild(input);
            container.appendChild(document.createElement('br'));
        }
    } else {
        container.classList.add('hidden');
    }
});

function majTotalVariable(){
    const inputs = d('variableInputs').querySelectorAll('input');
    let total = 0;
    inputs.forEach(i => total += parseFloat(i.value) || 0);
    d('totalVariable').innerText = total.toFixed(2);
}

// ------------------ FISCAL COLLAPSIBLE ------------------
function toggleFiscalMan(){ d('fiscContent').classList.toggle('active'); }

// ------------------ CALCUL ------------------
d('btnCalculer').addEventListener('click', genererTableau);

function genererTableau(){
    const base = recalculerBase();
    const duree = parseInt(d('dureeEco').value) || 5;
    const methode = d('typeEco').value;
    const plan = [];
    let cumul = 0;

    if(methode === 'variable'){
        const inputs = d('variableInputs').querySelectorAll('input');
        let totalSaisie = 0;
        inputs.forEach(inp => totalSaisie += parseFloat(inp.value)||0);
        inputs.forEach((inp, idx) => {
            const dot = (parseFloat(inp.value)||0) * base / totalSaisie;
            cumul += dot;
            plan.push({ annee: idx+1, dot, cumul, vnc: base-cumul });
        });
    }
    else if(methode === 'lineaire'){
        const dateDeb = new Date(d('dateService').value);
        const dateFin = new Date(d('bilanFin').value);
        const prorata1 = jours360(dateDeb,dateFin)/360;
        const dureeReelle = (prorata1===1)? duree : duree+1;

        for(let i=0;i<dureeReelle;i++){
            let dot;
            if(i===0) dot = base/duree*prorata1;
            else if(i===dureeReelle-1) dot = base/duree*(1-prorata1);
            else dot = base/duree;
            cumul += dot;
            plan.push({ annee: i+1, dot, cumul, vnc: base-cumul });
        }
    }
    else if(methode === 'degressif'){
        if(duree <= 2){
            alert("Dégressif non autorisé pour durée ≤ 2 ans");
            return;
        }
        const dateDeb = new Date(d('dateService').value);
        const mois = 12 - dateDeb.getMonth(); // mois complets pour année 1
        const coeff = (duree<=4)?1.25:(duree<=6)?1.75:2.25;
        let vnc = base;
        let dureeRestante = duree;

        for(let i=0;i<duree;i++){
            let tauxLin = 1/dureeRestante;
            let tauxDeg = (1/duree)*coeff;
            let dot = vnc*tauxDeg;
            if(i===0) dot = vnc*tauxDeg*(mois/12);

            // Si linéaire restant devient plus favorable, bascule
            if(dot < vnc*tauxLin) dot = vnc*tauxLin;

            cumul += dot;
            plan.push({ annee: i+1, dot, cumul, vnc: base-cumul });
            vnc -= dot;
            dureeRestante--;
        }
    }

    // Génération tableau
    let html = "<tr><th>Année</th><th>Dotation</th><th>Cumul</th><th>VNC</th></tr>";
    plan.forEach(r => {
        html += `<tr>
            <td>${r.annee}</td>
            <td>${euro(r.dot)}</td>
            <td>${euro(r.cumul)}</td>
            <td>${euro(r.vnc)}</td>
        </tr>`;
    });
    d('tableNormal').innerHTML = html;
    d('zoneTableau').classList.remove('hidden');
}

// ------------------ JOURS360 ------------------
function jours360(start,end){
    const d1 = new Date(start);
    const d2 = new Date(end);
    return ((d2.getFullYear() - d1.getFullYear())*360 + (d2.getMonth()-d1.getMonth())*30 + (d2.getDate()-d1.getDate()));
}
