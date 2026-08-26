import './estilo.css';
import { montarPainel } from './aplicacao';
import { carregarLimiares, salvarLimiares } from './config/persistencia';
import { renderConfig, lerLimiaresDoFormulario } from './render/config-ui';

const MENSAGEM_VAZIO = '<p class="vazio">Carregue um arquivo para ver os indicadores.</p>';

const CASCA = `<header class="cabecalho">
  <h1>Painel de Acompanhamento Pedagógico — EJA</h1>
  <p>Os dados são lidos no seu computador. Nada é enviado pela internet.</p>
</header>
<section class="entrada">
  <label for="arquivo">Arquivo de alunos (.txt ou .csv, separado por ponto e vírgula)</label>
  <input id="arquivo" type="file" accept=".txt,.csv,text/plain,text/csv" />
  <div id="area-soltar" class="area-soltar">Ou arraste o arquivo até aqui</div>
</section>
<div id="config"></div>
<main id="painel" aria-live="polite">${MENSAGEM_VAZIO}</main>`;

let limiares = carregarLimiares();
let textoAtual = '';

function atualizar(raiz: HTMLElement): void {
  const painel = raiz.querySelector<HTMLElement>('#painel');
  if (!painel) return;
  painel.innerHTML = textoAtual === '' ? MENSAGEM_VAZIO : montarPainel(textoAtual, limiares);
}

function lerArquivo(arquivo: File, raiz: HTMLElement): void {
  const leitor = new FileReader();
  leitor.onload = () => {
    textoAtual = String(leitor.result ?? '');
    atualizar(raiz);
  };
  leitor.onerror = () => {
    const painel = raiz.querySelector<HTMLElement>('#painel');
    if (painel) painel.innerHTML = '<p class="vazio">Não foi possível ler o arquivo. Tente selecioná-lo novamente.</p>';
  };
  leitor.readAsText(arquivo, 'utf-8');
}

export function iniciar(raiz: HTMLElement): void {
  raiz.innerHTML = CASCA;

  const areaConfig = raiz.querySelector<HTMLElement>('#config');
  if (areaConfig) areaConfig.innerHTML = renderConfig(limiares);

  raiz.querySelector<HTMLInputElement>('#arquivo')?.addEventListener('change', (evento) => {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (arquivo) lerArquivo(arquivo, raiz);
  });

  const area = raiz.querySelector<HTMLElement>('#area-soltar');
  area?.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('area-soltar--ativa');
  });
  area?.addEventListener('dragleave', () => area.classList.remove('area-soltar--ativa'));
  area?.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('area-soltar--ativa');
    const arquivo = e.dataTransfer?.files?.[0];
    if (arquivo) lerArquivo(arquivo, raiz);
  });

  areaConfig?.addEventListener('change', () => {
    limiares = lerLimiaresDoFormulario(areaConfig);
    salvarLimiares(limiares);
    atualizar(raiz);
  });
}

const raiz = document.querySelector<HTMLElement>('#app');
if (raiz) iniciar(raiz);
