// --- UTILITAIRES ---
const joursEntre = (dateDebut, dateFin) => {
    const diffMs = dateFin - dateDebut;
    return diffMs / (1000 * 60 * 60 * 24) + 1; // inclusif
};

const moisEntiersEntre = (dateDebut, dateFin) => {
    return (dateFin.getFullYear() - dateDebut.getFullYear()) * 12 + (dateFin.getMonth() - dateDebut.getMonth()) + 1;
};

// --- MOTEURS ---
function amortissementLineaire(base, duree, dateDebut, dateFin) {
    const amortissements = [];
    for (let i = 0; i < duree; i++) {
        let deb = i === 0 ? dateDebut : new Date(dateDebut.getFullYear() + i, dateDebut.getMonth(), dateDebut.getDate());
        let fin = new Date(dateDebut.getFullYear() + i, dateDebut.getMonth(), dateDebut.getDate());
        if (i === 0) fin = dateFin < new Date(deb.getFullYear(), 11, 31) ? dateFin : new Date(deb.getFullYear(), 11, 31);
        let ratio = joursEntre(deb, fin) / 360;
        amortissements.push((base / duree) * ratio);
    }
    return amortissements;
}

function amortissementDegressif(base, duree, dateDebut, dateCession = null) {
    if (duree <= 2) throw new Error("Dégressif non autorisé pour durée <= 2");
    const coeff = duree <= 4 ? 1.25 : duree <= 6 ? 1.75 : 2.25;
    let amortissements = [];
    let vnc = base;

    for (let i = 0; i < duree; i++) {
        let t = (1 / duree) * coeff;
        if (i === 0) {
            // prorata mois entiers
            const mois = 12 - dateDebut.getMonth();
            t *= mois / 12;
        }

        let linRestant = (1 / (duree - i));
        let amort = vnc * t;
        // comparer avec linéaire restant
        if (amort / vnc < linRestant) amort = vnc * linRestant;

        // gestion cession
        if (dateCession && i === duree - 1) {
            const fin = new Date(dateCession.getFullYear(), dateCession.getMonth() - 1, 0);
            const moisProrata = moisEntiersEntre(new Date(dateDebut.getFullYear() + i, 0, 1), fin) / 12;
            amort *= moisProrata;
        }

        amortissements.push(amort);
        vnc -= amort;
        if (vnc <= 0) break;
    }

    return amortissements;
}

function amortissementVariable(base, valeurs) {
    const total = valeurs.reduce((acc, v) => acc + v, 0);
    return valeurs.map(v => base * v / total);
}
