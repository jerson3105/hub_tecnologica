const { categoriaSegura, EXTENSIONES_POR_MIME } = require('../middleware/upload');

describe('upload middleware', () => {
  it.each([
    ['taller', 'taller'],
    ['otro', 'otro'],
    ['../../src', 'otro'],
    ['mentores', 'otro'],
    [undefined, 'otro']
  ])('categoriaSegura(%s) -> %s', (categoria, esperado) => {
    expect(categoriaSegura(categoria)).toBe(esperado);
  });

  it('never maps an accepted MIME type to an executable web extension', () => {
    const extensiones = Object.values(EXTENSIONES_POR_MIME);
    ['.html', '.htm', '.js', '.svg', '.xhtml'].forEach(ext => {
      expect(extensiones).not.toContain(ext);
    });
  });
});
