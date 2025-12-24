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
        d('totalVariable').innerText = '0';
    }
});

function majTotalVariable(){
    const inputs = d('variableInputs').querySelectorAll('input');
    let total = 0;
    inputs.forEach(i => total += parseFloat(i.value) || 0);
    d('totalVariable').innerText = total.toFixed(2);
}

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
        inputs.forEach((inp, idx) => {
            const dot = (parseFloat(inp.value)||0) * base / 100; // règle de 3
            cumul += dot;
            plan.push({ annee: idx+1, dot, cumul, vnc: base-cumul });
        });
    } else if(methode === 'lineaire'){
        const dateDeb = new Date(d('dateService').value);
        const dateFin = new Date(d('bilanFin').value);
        const prorata1 = jours360(dateDeb,dateFin)/360;
        const dureeReelle = (prorata1===1)? duree : duree+1;

        for(let i=0;i<dureeReelle;i++){
            let dot = (i===0)? base/duree*prorata1 : (i===dureeReelle-1)? base/duree*(1-prorata1) : base/duree;
            cumul += dot;
            plan.push({ annee: i+1, dot, cumul, vnc: base-cumul });
        }

    } else if(methode === 'degressif'){
        const dateDeb = new Date(d('dateService').value);
        const mois = 12 - dateDeb.getMonth();
        for(let i=0;i<duree;i++){
            let dot = (i===0)? base/duree*(mois/12) : base/duree;
            cumul += dot;
            plan.push({ annee: i+1, dot, cumul, vnc: base-cumul });
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
