import { validarLimiares, type Limiares } from '../config/limiares';

export function renderConfig(limiares: Limiares): string {
  return `<section class="config">
  <h2>Limiares de alerta</h2>
  <p>Ajuste conforme o perfil das turmas. A alteração vale para este navegador.</p>
  <div class="config__campos">
    <div>
      <label for="limiar-frequencia">Frequência mínima (%)</label>
      <input id="limiar-frequencia" name="limiar-frequencia" type="number" min="0" max="100" step="1" value="${limiares.frequenciaMinima}" />
    </div>
    <div>
      <label for="limiar-faltas">Faltas consecutivas</label>
      <input id="limiar-faltas" name="limiar-faltas" type="number" min="1" max="60" step="1" value="${limiares.faltasConsecutivas}" />
    </div>
    <div>
      <label for="limiar-nota">Média mínima</label>
      <input id="limiar-nota" name="limiar-nota" type="number" min="0" max="10" step="0.1" value="${limiares.notaMinima}" />
    </div>
  </div>
</section>`;
}

function valor(raiz: ParentNode, id: string): number {
  const campo = raiz.querySelector<HTMLInputElement>(`#${id}`);
  return campo ? Number(campo.value) : Number.NaN;
}

export function lerLimiaresDoFormulario(raiz: ParentNode): Limiares {
  return validarLimiares({
    frequenciaMinima: valor(raiz, 'limiar-frequencia'),
    faltasConsecutivas: valor(raiz, 'limiar-faltas'),
    notaMinima: valor(raiz, 'limiar-nota'),
  });
}
