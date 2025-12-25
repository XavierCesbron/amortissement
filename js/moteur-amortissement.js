function calculAmortissement(params) {
  const {
    base,
    duree,
    mode,
    dateAcquisition,
    dateCloture,
    dateCession
  } = params;

  let vnc = base;
  let resultat = [];

  const tauxLineaire = 1 / duree;
  const tauxDegressif = getTauxDegressif(duree);

  let annee = 1;
  let dateDebutExercice = new Date(dateAcquisition);

  while (vnc > 0 && annee <= duree + 1) {

    let prorata = 1;

    if (mode === "lineaire") {
      const fin = dateCession ?? dateCloture;
      prorata = calculProrataLineaire(dateDebutExercice, fin);
    }

    if (mode === "degressif") {
      const fin = dateCession
        ? new Date(dateCession.getFullYear(), dateCession.getMonth(), 0)
        : dateCloture;

      prorata = calculProrataDegressif(dateDebutExercice, fin);
    }

    let taux = (mode === "degressif")
      ? Math.max(tauxDegressif, 1 / (duree - (annee - 1)))
      : tauxLineaire;

    let dotation = vnc * taux * prorata;

    resultat.push({
      annee,
      dotation: Math.round(dotation * 100) / 100,
      vncDebut: vnc
    });

    vnc -= dotation;
    annee++;
  }

  return resultat;
}
