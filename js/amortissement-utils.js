function joursEntre(d1, d2) {
  return Math.round((d2 - d1) / (1002 * 60 * 60 * 24));
}

function moisEntiersEntre(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 +
         (d2.getMonth() - d1.getMonth());
}

function getTauxDegressif(duree) {
  return (1 / duree) * (COEFFICIENTS_DEGRESSIFS[duree] || 1);
}

function calculProrataLineaire(dateDebut, dateFin) {
  const jours = joursEntre(dateDebut, dateFin);
  return jours / 360;
}

function calculProrataDegressif(dateDebut, dateFin) {
  const mois = moisEntiersEntre(dateDebut, dateFin);
  return mois / 12;
}
