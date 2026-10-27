/**
 * Clases de Español · UniCPO — banco de dados do site na Planilha Google.
 *
 * O site guarda tudo na aba oculta "_dados". As abas Alunos, Turmas,
 * Cronograma, Alterações e Chamadas são geradas a cada salvamento só para
 * consulta: edite pelo site, não por elas (seriam sobrescritas).
 */

// Troque pela senha que o professor vai digitar no site.
const SENHA = 'TROQUE_ESTA_SENHA';

const DIA_L = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function doGet() {
  return out({ok: true, msg: 'API das aulas de espanhol funcionando.'});
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out({erro: 'Pedido inválido'}); }
  if (SENHA === 'TROQUE_ESTA_SENHA') return out({erro: 'Defina a senha no Apps Script'});
  if (req.senha !== SENHA) { Utilities.sleep(1000); return out({erro: 'senha'}); }

  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const rev = Number(props.getProperty('REV') || 0);
    if (req.acao === 'ler') return out({ok: true, rev: rev, dados: lerDados()});
    if (req.acao === 'salvar') {
      // outro computador salvou depois da última leitura deste: devolve a versão atual
      if (req.rev !== rev) return out({erro: 'conflito', rev: rev, dados: lerDados()});
      gravarDados(req.dados);
      props.setProperty('REV', String(rev + 1));
      try { atualizarAbas(req.dados); } catch (err) { console.error(err); }
      return out({ok: true, rev: rev + 1});
    }
    return out({erro: 'Ação desconhecida'});
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function abaDados() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('_dados');
  if (!sh) { sh = ss.insertSheet('_dados'); sh.hideSheet(); }
  return sh;
}

function lerDados() {
  const sh = abaDados(), n = sh.getLastRow();
  if (!n) return null;
  const txt = sh.getRange(1, 1, n, 1).getValues().map(r => r[0]).join('');
  return txt ? JSON.parse(txt) : null;
}

function gravarDados(dados) {
  const sh = abaDados(), txt = JSON.stringify(dados), parts = [];
  for (let i = 0; i < txt.length; i += 40000) parts.push([txt.slice(i, i + 40000)]);  // célula aceita até 50 mil caracteres
  sh.clearContents();
  // formato texto antes de gravar, para nenhum pedaço ser lido como fórmula ou número
  sh.getRange(1, 1, parts.length, 1).setNumberFormat('@').setValues(parts);
}

function escreve(nome, cab, linhas) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
  sh.clearContents();
  const vals = [cab].concat(linhas);
  sh.getRange(1, 1, vals.length, cab.length).setValues(vals);
  sh.getRange(1, 1, 1, cab.length).setFontWeight('bold').setBackground('#eef0f3');
  sh.getRange(1, 1).setNote('Gerado automaticamente pelo site. Edite pelo site: mudanças feitas aqui são sobrescritas.');
  sh.setFrozenRows(1);
}

function data(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

function atualizarAbas(d) {
  const alunos = {}, turmas = {};
  d.alunos.forEach(a => { alunos[a.id] = a; a._p = 0; a._f = 0; });
  d.turmas.forEach(t => { turmas[t.id] = t; });
  d.aulas.forEach(au => Object.keys(au.reg).forEach(id => { const a = alunos[id]; if (a) au.reg[id] === 'P' ? a._p++ : a._f++; }));
  const turmasDo = id => d.turmas.filter(t => t.alunos.indexOf(id) >= 0).map(t => t.nome).join(' + ');
  const nomes = t => t.alunos.map(id => alunos[id] ? alunos[id].nome : '').filter(String).join(', ');
  const horarios = t => t.slots.slice().sort((a, b) => a.dia - b.dia || (a.ini < b.ini ? -1 : 1)).map(s => DIA_L[s.dia].slice(0, 3) + ' ' + s.ini + '–' + s.fim).join(' · ');

  escreve('Alunos', ['Nome', 'Departamento', 'Nível', 'Turmas', 'Presenças', 'Faltas', 'Presença %', 'Observações'],
    d.alunos.map(a => [a.nome, a.departamento, a.nivel, turmasDo(a.id), a._p, a._f, a._p + a._f ? Math.round(a._p / (a._p + a._f) * 100) : '', a.obs || '']));
  escreve('Turmas', ['Turma', 'Nível', 'Horários', 'Alunos', 'Qtd. alunos', 'Link'],
    d.turmas.map(t => [t.nome, t.nivel, horarios(t), nomes(t), t.alunos.length, t.link || '']));
  const crono = [];
  d.turmas.forEach(t => t.slots.forEach(s => crono.push([s.dia, DIA_L[s.dia], s.ini, s.fim, t.nome, nomes(t)])));
  crono.sort((a, b) => a[0] - b[0] || (a[2] < b[2] ? -1 : 1));
  escreve('Cronograma', ['Dia', 'Início', 'Fim', 'Turma', 'Alunos'], crono.map(r => r.slice(1)));
  escreve('Alterações', ['Data', 'Turma', 'Tipo', 'Horário', 'Motivo'],
    (d.excecoes || []).slice().sort((a, b) => a.data < b.data ? -1 : 1).map(e => [data(e.data), turmas[e.turmaId] ? turmas[e.turmaId].nome : '',
      e.tipo === 'extra' ? 'Aula extra' : 'Cancelada', e.ini + (e.fim ? '–' + e.fim : ''), e.motivo || '']));
  const ch = [];
  d.aulas.slice().sort((a, b) => a.data < b.data ? -1 : 1).forEach(au => Object.keys(au.reg).forEach(id => {
    const a = alunos[id] || {};
    ch.push([data(au.data), DIA_L[data(au.data).getDay()], turmas[au.turmaId] ? turmas[au.turmaId].nome : '', a.nome || '', a.departamento || '',
      au.reg[id] === 'P' ? 'Presença' : 'Falta', (au.obs && au.obs[id]) || '', au.tema || '']);
  }));
  escreve('Chamadas', ['Data', 'Dia', 'Turma', 'Aluno', 'Departamento', 'Marcação', 'Observação', 'Conteúdo'], ch);
}
