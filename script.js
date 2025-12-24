const d = id => document.getElementById(id);
const € = v => v.toLocaleString('fr-FR',{style:'currency',currency:'EUR'});

function prorata(dateDebut, dateFin){
  const jours = (dateFin - dateDebut) / 86400000 + 1;
  return jours / 360;
}

function recalculerBase(){
  let base = +d('baseHT').value || 0;
  if(d('isVehicule').checked) base *= 1.2;
  base -= (+d('valeurResiduelle').value || 0);
  d('baseAmort').innerText = €(base);
  return base;
}

function calculer(){
  const base = recalculerBase();

  const serv = new Date(d('dateServ').value);
  const open = new Date(d('dateOpen').value);
  const close = new Date(d('dateClose').value);

  const duree = +d('dureeCompta').value;
  const taux = 1 / duree;

  let cumul = 0;
  let html = '<tr><th>Année</th><th>Dotation</th><th>Cumul</th><th>VNC</th></tr>';

  for(let i=0;i<duree;i++){
    let dot = base * taux;
    if(i === 0 && serv > open) dot *= prorata(serv, close);
    if(i === duree-1) dot = base - cumul;
    cumul += dot;
    html += `<tr>
      <td>${open.getFullYear()+i}</td>
      <td>${€(dot)}</td>
      <td>${€(cumul)}</td>
      <td>${€(base-cumul)}</td>
    </tr>`;
  }

  d('tableAmort').innerHTML = html;
}

d('btnCalculer').addEventListener('click', calculer);

d('dateAcq').addEventListener('change', e=>{
  const y = new Date(e.target.value).getFullYear();
  d('dateServ').value = e.target.value;
  d('dateOpen').value = `${y}-01-01`;
  d('dateClose').value = `${y}-12-31`;
});

['baseHT','valeurResiduelle','isVehicule']
.forEach(id => d(id).addEventListener('input', recalculerBase));
