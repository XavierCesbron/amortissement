document.getElementById("btnCalcul").addEventListener("click", () => {

  const data = {
    base: parseFloat(document.getElementById("base").value),
    duree: parseInt(document.getElementById("duree").value),
    mode: document.getElementById("mode").value,
    dateAcquisition: new Date(document.getElementById("dateAcquisition").value),
    dateCloture: new Date(document.getElementById("dateCloture").value),
    dateCession: document.getElementById("dateCession").value
      ? new Date(document.getElementById("dateCession").value)
      : null
  };

  const res = calculAmortissement(data);
  document.getElementById("resultat").textContent =
    JSON.stringify(res, null, 2);
});
