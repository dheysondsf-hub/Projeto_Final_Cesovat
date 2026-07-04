const test = require('node:test');
const assert = require('node:assert/strict');
const { validarHorarioAgendamento, deveBloquearAlteracaoStatusCliente, normalizarStatusMensagemContato } = require('../agendaUtils');

test('aceita agendamentos entre 07:00 e 18:00', () => {
  assert.equal(validarHorarioAgendamento('07:00').valido, true);
  assert.equal(validarHorarioAgendamento('12:30').valido, true);
  assert.equal(validarHorarioAgendamento('18:00').valido, true);
});

test('bloqueia agendamentos fora do horário permitido', () => {
  assert.equal(validarHorarioAgendamento('06:59').valido, false);
  assert.equal(validarHorarioAgendamento('18:01').valido, false);
});

test('bloqueia alteração de status por cliente', () => {
  assert.equal(
    deveBloquearAlteracaoStatusCliente('cliente', 'confirmado', { status: 'pendente' }),
    true
  );
  assert.equal(
    deveBloquearAlteracaoStatusCliente('admin', 'confirmado', { status: 'pendente' }),
    false
  );
});

test('normaliza status de mensagem de contato', () => {
  assert.equal(normalizarStatusMensagemContato('contatado'), 'contatado');
  assert.equal(normalizarStatusMensagemContato(undefined), 'pendente');
  assert.equal(normalizarStatusMensagemContato('outro'), 'pendente');
});
