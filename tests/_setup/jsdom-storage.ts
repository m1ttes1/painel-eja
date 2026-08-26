/**
 * Node 22+ expõe um `localStorage` global nativo (experimental, sem
 * --localstorage-file) que fica indefinido e ocupa o slot global antes do
 * ambiente jsdom do Vitest tentar instalar o seu — o merge do Vitest não
 * sobrescreve uma propriedade global já existente. Resultado: em ambiente
 * jsdom, `localStorage` fica undefined mesmo com jsdom instalado. Este
 * polyfill mínimo substitui o slot quebrado só quando ele não funciona.
 */
class ArmazenamentoMemoria implements Storage {
  private dados = new Map<string, string>();
  get length(): number {
    return this.dados.size;
  }
  clear(): void {
    this.dados.clear();
  }
  getItem(chave: string): string | null {
    return this.dados.has(chave) ? this.dados.get(chave)! : null;
  }
  key(indice: number): string | null {
    return [...this.dados.keys()][indice] ?? null;
  }
  removeItem(chave: string): void {
    this.dados.delete(chave);
  }
  setItem(chave: string, valor: string): void {
    this.dados.set(chave, String(valor));
  }
}

if (typeof window !== 'undefined' && typeof window.localStorage?.setItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new ArmazenamentoMemoria(),
    configurable: true,
    writable: true,
  });
}
