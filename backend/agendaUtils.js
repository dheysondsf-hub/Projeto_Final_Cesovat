function validarHorarioAgendamento(horario) {
  if (!horario) {
    return { valido: false, mensagem: 'Horário é obrigatório.' };
  }

  const [hora, minuto] = horario.split(':').map(Number);
  const minutos = hora * 60 + minuto;
  const inicio = 7 * 60;
  const fim = 18 * 60;

  if (Number.isNaN(minutos) || minutos < inicio || minutos > fim) {
    return {
      valido: false,
      mensagem: 'O horário do agendamento deve estar entre 07:00 e 18:00.',
    };
  }

  return { valido: true };
}

function deveBloquearAlteracaoStatusCliente(role, status, agendamentoAtual) {
  if (role !== 'cliente') {
    return false;
  }

  return Boolean(status && status !== agendamentoAtual?.status);
}

function normalizarStatusMensagemContato(status) {
  return status === 'contatado' ? 'contatado' : 'pendente';
}

module.exports = {
  validarHorarioAgendamento,
  deveBloquearAlteracaoStatusCliente,
  normalizarStatusMensagemContato,
};
