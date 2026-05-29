import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function inviaEmailConferma(params: {
  nome: string;
  email: string;
  orderId: number;
  prezzoTotale: number;
}) {
  const { nome, email, orderId, prezzoTotale } = params;
  await transporter.sendMail({
    from: `"Taglio Laser" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Conferma ordine #${orderId} — Taglio Laser`,
    html: `
      <h2>Grazie ${nome}!</h2>
      <p>Il tuo ordine <strong>#${orderId}</strong> è stato ricevuto.</p>
      <p><strong>Totale: €${prezzoTotale.toFixed(2)}</strong></p>
      <p>Ti contatteremo presto per confermare i dettagli e organizzare la consegna.</p>
    `,
  });
}
