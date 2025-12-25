// moteur-amort.js

const getV = (id) => document.getElementById(id).value;
const getN = (id) => parseFloat(getV(id)) || 0;
const formatC = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

// ================== BASE ==================
function calculerBase() {
    const mtHT = getN('montantHT');
    const vr = getN('valeurResiduelle');
    const isVehicule = document.getElementById('isVehicule').checked;
    const base = (isVehicule ? mtHT * 1.2 : mtHT) - vr;
    document.getElementById('resultatBase').innerText = formatC(base);
    return base;
}

// ================== VARIABLES ==================
function genererChampsVariable(duree) {
    const container = document.getElementById('variableContainer');
    if(!container) return;
    container.innerHTML = '';
    for(let i=1;i<=duree;i++){
        const div = document.createElement('div');
        div.className='flex items-center gap-2';
        div.innerHTML = `<label class="text-[10px]">Année ${i}</label><input type="number" class="variableInput w-16 p-1 border rounded text-center" value="1">`;
        container.appendChild(div);
    }
}

// ================== UTILITAIRES ==================
function nbMoisEntiers(d1, d2){
    let months = (d2.getFullYear()-d1.getFullYear())*12 + (d2.getMonth()-d1.getMonth());
    if(d2.getDate()<d1.getDate()) months--;
    return months;
}

function prorataLinaire(dDebut, dFin){
    return (dFin - dDebut)/86400000 + 1; // jours exacts
}

// ================== MOTEURS ==================
function calculerAmortissement({base, duree, mode, dDebut, dFin, dCession, variableValues}) {
    let plan = [];
    let cumul = 0;
    const today = new Date();

    if(mode === 'lineaire'){
        for(let i=0;i<duree;i++){
            let deb = new Date(dDebut); deb.setFullYear(deb.getFullYear()+i);
            let fin = new Date(dDebut); fin.setFullYear(fin.getFullYear()+i+1); fin.setDate(fin.getDate()-1);
            if(dCession && i===duree-1 && dCession<fin) fin = new Date(dCession);
            const ratio = prorataLinaire(deb, fin)/360; // base 360
            let dot = Math.min(base/duree*ratio, base - cumul);
            cumul += dot;
            plan.push({annee: deb.getFullYear(), dot, cumul});
        }
    }
    else if(mode === 'degressif'){
        const coeff = duree<=4?1.25:duree<=6?1.75:2.25;
        let vnc = base;
        for(let i=0;i<duree;i++){
            let deb = new Date(dDebut); deb.setFullYear(deb.getFullYear()+i); deb.setDate(1); // 1er jour du mois
            let fin = new Date(deb); fin.setMonth(fin.getMonth()+12); fin.setDate(fin.getDate()-1);
            if(dCession && i===duree-1 && dCession<fin) fin = new Date(dCession.getFullYear(), dCession.getMonth(), 0); // dernier jour mois précédent
            const mois = nbMoisEntiers(deb, fin);
            let dot = 0;
            let t = 1/duree*coeff;
            dot = vnc * t * (mois/12);
            // switch linéaire si taux dégressif < linéaire restant
            const linRest = (vnc)/(duree-i);
            if(dot<linRest) dot=linRest;
            if(dot>vnc) dot=vnc;
            vnc -= dot;
            cumul = base - vnc;
            plan.push({annee: deb.getFullYear(), dot, cumul});
            if(vnc<=0) break;
        }
    }
    else if(mode==='variable'){
        const sumVar = variableValues.reduce((a,b)=>a+b,0);
        for(let i=0;i<variableValues.length;i++){
            const dot = base*variableValues[i]/sumVar;
            cumul += dot;
            plan.push({annee: dDebut.getFullYear()+i, dot, cumul});
        }
    }
    return plan;
}

// ================== AFFICHAGE ==================
function afficherPlan(plan, tableId){
    let html = '<thead class="bg-slate-800 text-white uppercase text-[10px]"><tr><th>Année</th><th>Dotation</th><th>Cumul</th></tr></thead><tbody>';
    plan.forEach(r=>{
        html+=`<tr class="border-b"><td>${r.annee}</td><td>${formatC(r.dot)}</td><td>${formatC(r.cumul)}</td></tr>`;
    });
    html+='</tbody>';
    document.getElementById(tableId).innerHTML=html;
}

// ================== MAIN ==================
document.getElementById('btnCalcul').addEventListener('click',()=>{
    const base = calculerBase();
    const duree = parseInt(getV('dureeEco')) || 5;
    const mode = document.getElementById('typeEco').value;
    const dAcq = new Date(getV('dateAcq'));
    const dServ = new Date(getV('dateService'));
    const dCess = getV('dateCession')?new Date(getV('dateCession')):null;

    let variableValues=[];
    if(mode==='variable'){
        const inputs = document.querySelectorAll('.variableInput');
        inputs.forEach(inp=>variableValues.push(parseFloat(inp.value)||0));
    }

    const plan = calculerAmortissement({
        base,
        duree,
        mode,
        dDebut: dServ,
        dFin: new Date(dServ.getFullYear()+duree-1,11,31),
        dCession: dCess,
        variableValues
    });

    afficherPlan(plan,'tableNormal');
});
