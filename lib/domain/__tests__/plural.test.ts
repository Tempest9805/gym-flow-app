import { pluralize } from '../plural';

describe('pluralize', () => {
  it('usa el singular solo con uno', () => {
    expect(pluralize(1, 'rutina', 'rutinas')).toBe('1 rutina');
  });

  it('usa el plural con varios', () => {
    expect(pluralize(2, 'rutina', 'rutinas')).toBe('2 rutinas');
    expect(pluralize(169, 'ejercicio', 'ejercicios')).toBe('169 ejercicios');
  });

  // En espanol el cero va en plural: "0 rutinas", no "0 rutina".
  it('usa el plural con cero', () => {
    expect(pluralize(0, 'rutina', 'rutinas')).toBe('0 rutinas');
  });

  it('acepta plurales irregulares', () => {
    expect(pluralize(1, 'día', 'días')).toBe('1 día');
    expect(pluralize(4, 'día', 'días')).toBe('4 días');
  });
});
