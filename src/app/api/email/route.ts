import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const emailCliente = body.emailCliente
  const emailDono = body.emailDono
  const nomeCliente = body.nomeCliente
  const nomeEstabelecimento = body.nomeEstabelecimento
  const nomeServico = body.nomeServico
  const nomeProfissional = body.nomeProfissional
  const dataHora = body.dataHora
  const preco = body.preco
  const duracao = body.duracao

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  })

  const profissionalRow = nomeProfissional
    ? '<tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Profissional</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">' + nomeProfissional + '</td></tr></table></td></tr>'
    : ''

  const htmlCliente = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Agendamento confirmado</title></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:48px 16px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="text-align:center;padding-bottom:24px"><p style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">Agenda<span style="color:#00C27C">Fácil</span></p></td></tr><tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08)"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#00C27C 0%,#00a86b 100%);padding:40px 40px 32px;text-align:center"><p style="margin:0 0 16px;font-size:48px;line-height:1">✅</p><h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">Agendamento confirmado!</h1><p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85)">' + nomeEstabelecimento + ' está te esperando</p></td></tr><tr><td style="padding:36px 40px"><p style="margin:0 0 28px;font-size:16px;color:#555;line-height:1.6">Olá, <strong style="color:#1a1a1a">' + nomeCliente + '</strong>! Seu agendamento foi realizado com sucesso. Confira os detalhes abaixo:</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;border-radius:14px;overflow:hidden;border:1px solid #eef0f3"><tr><td style="padding:0 24px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Serviço</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">' + nomeServico + '</td></tr></table></td></tr>' + profissionalRow + '<tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Data e horário</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">📅 ' + dataHora + '</td></tr></table></td></tr><tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Duração</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">⏱ ' + duracao + '</td></tr></table></td></tr><tr><td style="padding:14px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Valor</td></tr><tr><td style="font-size:20px;font-weight:700;color:#00C27C">' + preco + '</td></tr></table></td></tr></table></td></tr></table><p style="margin:28px 0 0;font-size:14px;color:#999;text-align:center;line-height:1.6">Nos vemos em breve! 😊<br>Caso precise cancelar, entre em contato com o estabelecimento.</p></td></tr><tr><td style="background:#f8fafb;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0"><p style="margin:0;font-size:12px;color:#bbb">© 2025 <strong style="color:#00C27C">AgendaFácil</strong> · Feito com ❤ no Brasil</p></td></tr></table></td></tr></table></td></tr></table></body></html>'

  const htmlDono = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Novo agendamento</title></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:48px 16px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="text-align:center;padding-bottom:24px"><p style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">Agenda<span style="color:#00C27C">Fácil</span></p></td></tr><tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08)"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px 40px 32px;text-align:center"><p style="margin:0 0 16px;font-size:48px;line-height:1">🔔</p><h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">Novo agendamento!</h1><p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85)">Você recebeu um novo agendamento em ' + nomeEstabelecimento + '</p></td></tr><tr><td style="padding:36px 40px"><p style="margin:0 0 28px;font-size:16px;color:#555;line-height:1.6"><strong style="color:#1a1a1a">' + nomeCliente + '</strong> acabou de realizar um agendamento. Acesse o painel para confirmar.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;border-radius:14px;overflow:hidden;border:1px solid #eef0f3"><tr><td style="padding:0 24px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Cliente</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">👤 ' + nomeCliente + '</td></tr></table></td></tr><tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Serviço</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">' + nomeServico + '</td></tr></table></td></tr>' + profissionalRow + '<tr><td style="padding:14px 0;border-bottom:1px solid #f0f0f0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Data e horário</td></tr><tr><td style="font-size:15px;font-weight:600;color:#1a1a1a">📅 ' + dataHora + '</td></tr></table></td></tr><tr><td style="padding:14px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#999;padding-bottom:4px">Valor</td></tr><tr><td style="font-size:20px;font-weight:700;color:#00C27C">' + preco + '</td></tr></table></td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td align="center"><a href="http://localhost:3000/dashboard/agendamentos" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:100px;text-decoration:none">Ver agendamento no painel →</a></td></tr></table></td></tr><tr><td style="background:#f8fafb;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0"><p style="margin:0;font-size:12px;color:#bbb">© 2025 <strong style="color:#00C27C">AgendaFácil</strong> · Feito com ❤ no Brasil</p></td></tr></table></td></tr></table></td></tr></table></body></html>'

  try {
    await transporter.sendMail({
      from: '"AgendaFácil" <' + gmailUser + '>',
      to: emailCliente,
      subject: '✅ Agendamento confirmado — ' + nomeEstabelecimento,
      html: htmlCliente,
    })

    await transporter.sendMail({
      from: '"AgendaFácil" <' + gmailUser + '>',
      to: emailDono,
      subject: '🔔 Novo agendamento — ' + nomeCliente,
      html: htmlDono,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Erro:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}