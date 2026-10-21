/* Textos do registro do duelo. */

/** Descreve o resultado de um ataque. `who` = 'p' (jogador) ou 'o' (oponente). */
export function describeAttack(r, who) {
  if (r.face) return who === 'p' ? `${r.u.name} atacou o oponente direto: ${r.dmg} de dano!` : `${r.u.name} atacou você direto: ${r.dmg} de dano!`;
  const base = `${r.u.name} atacou ${r.d.name}: ataque ${r.dmg}${r.adv ? ' (vantagem de tipo!)' : ''} contra defesa ${r.def}.`;
  let t;
  if (r.shielded) t = `${r.u.name} atacou ${r.d.name}, mas o Escudo anulou o golpe!`;
  else if (!r.killed) t = base + ` Bloqueado, mas o dano fica: a defesa de ${r.d.name} cai para ${r.def - r.dmg}${who === 'p' ? '. Continue atacando para derrubá-lo!' : '.'}`;
  else t = base + ` ${r.d.name} foi destruído` + (r.pierce ? ` e ${who === 'p' ? 'o oponente' : 'você'} perde ${r.pierce} de vida!` : '.');
  if (r.gain.saque) t += ' Saque: +1 de energia.';
  if (r.gain.sangue) t += ' Sanguessuga: +1 de vida.';
  if (r.died) t += ` ${r.d.name} revidou com Contra-ataque e destruiu ${r.u.name}!`;
  return t;
}
