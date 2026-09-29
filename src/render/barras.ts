import { escapar, numero } from './formato';

export interface ItemBarra {
  rotulo: string;
  valor: number;
}

export interface OpcoesBarras {
  titulo: string;
  itens: ItemBarra[];
  maximo: number;
  /** Quando informado, desenha a linha de referência e destaca quem está abaixo. */
  limiar?: number;
  sufixo?: string;
}

const LARGURA = 640;
const ALTURA_BARRA = 28;
const ESPACO = 14;
const MARGEM_MINIMA = 150;
const MARGEM_TOPO = 16;
const MARGEM_DIREITA = 90;

export function graficoBarras({ titulo, itens, maximo, limiar, sufixo = '' }: OpcoesBarras): string {
  // ponytail: largura estimada por caractere (~7px na fonte do rótulo); troque por medição real se aparecer corte.
  const MARGEM_ESQUERDA = Math.max(MARGEM_MINIMA, ...itens.map((i) => i.rotulo.length * 7 + 16));
  const larguraUtil = LARGURA - MARGEM_ESQUERDA - MARGEM_DIREITA;
  const altura = MARGEM_TOPO * 2 + itens.length * (ALTURA_BARRA + ESPACO) + (limiar === undefined ? 0 : 18);

  const barras = itens
    .map((item, i) => {
      const y = MARGEM_TOPO + i * (ALTURA_BARRA + ESPACO);
      const largura = maximo === 0 ? 0 : Math.max(0, (item.valor / maximo) * larguraUtil);
      const abaixo = limiar !== undefined && item.valor < limiar;
      const classe = abaixo ? 'barra barra--alerta' : 'barra';
      const texto = `${numero(item.valor)}${sufixo}`;
      const sufixoAcessivel = abaixo ? ' — abaixo do limiar' : '';

      return `
    <text class="rotulo" x="${MARGEM_ESQUERDA - 10}" y="${y + ALTURA_BARRA / 2}" text-anchor="end" dominant-baseline="middle">${escapar(item.rotulo)}</text>
    <rect class="${classe}" x="${MARGEM_ESQUERDA}" y="${y}" width="${largura.toFixed(2)}" height="${ALTURA_BARRA}" rx="2" />
    <text class="valor" x="${MARGEM_ESQUERDA + largura + 8}" y="${y + ALTURA_BARRA / 2}" dominant-baseline="middle">${texto}${sufixoAcessivel}</text>`;
    })
    .join('');

  const linhaLimiar =
    limiar === undefined
      ? ''
      : (() => {
          const x = MARGEM_ESQUERDA + (limiar / maximo) * larguraUtil;
          return `
    <line class="limiar" x1="${x.toFixed(2)}" y1="${MARGEM_TOPO - 6}" x2="${x.toFixed(2)}" y2="${altura - 24}" />
    <text class="limiar-rotulo" x="${x.toFixed(2)}" y="${altura - 8}" text-anchor="middle">limiar ${numero(limiar)}${sufixo}</text>`;
        })();

  return `<figure class="grafico">
  <figcaption>${escapar(titulo)}</figcaption>
  <svg viewBox="0 0 ${LARGURA} ${altura}" role="img" aria-label="${escapar(titulo)}" preserveAspectRatio="xMinYMin meet">
    <title>${escapar(titulo)}</title>${barras}${linhaLimiar}
  </svg>
</figure>`;
}
