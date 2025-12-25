// --- MOTEUR LINÉAIRE ---
function amortissementLineaire(base, duree, dateService, dateCession=null) {
    const result = [];
    const start = new Date(dateService);
    const endExercice = new Date(start.getFullYear(), 11, 31);

    for (let i = 0; i < duree; i++) {
        let debut = i === 0 ? start : new Date(start.getFullYear()+i, 0, 1);
        let fin = i === duree-1 ? (dateCession || new Date(start.getFullYear()+i,11,31)) : new Date(start.getFullYear()+i,11,31);
        let jours = (fin - debut)/86400000 +1;
        let fraction = jours / 360; // base 360
        let dot = (base/duree) * fraction;
        result.push({annee: debut.getFullYear(), dot, cumul: result.reduce((s,r)=>s+r.dot,0)+dot});
    }
    return result;
}

// --- MOTEUR DÉGRESSIF ---
function amortissementDegressif(base, duree, dateService, dateCession=null) {
    if(duree <= 2) throw "Dégressif impossible sur durée <= 2 ans";
    const result = [];
    const start = new Date(dateService);
    let vnc = base;
    const coeff = duree <= 4 ? 1.25 : (duree <= 6 ? 1.75 : 2.25);

    for(let i=0;i<duree;i++){
        let tauxLin = 1/duree;
        let tauxD = coeff/duree;
        let dot = Math.max(vnc*tauxD, vnc*tauxLin);
        if(i===0) dot *= (12-start.getMonth())/12; // prorata mois entiers
        if(dateCession && i===duree-1) dot *= (dateCession.getMonth())/11;
        result.push({annee: start.getFullYear()+i, dot, cumul: base - (vnc -= dot)});
    }
    return result;
}

// --- MOTEUR VARIABLE ---
function amortissementVariable(base, duree) {
    const values = Array.from(document.querySelectorAll('.variableField')).map(v=>parseFloat(v.value)||0);
    const totalV = values.reduce((s,v)=>s+v,0);
    const result = values.map((v,i)=>({annee: i+1, dot: base*v/totalV}));
    return result;
}
