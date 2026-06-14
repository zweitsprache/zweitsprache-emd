import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Port specified to 3000 as per AI Studio constraints
const PORT = 3000;

// Import surveys list from src/data/items
import { SURVEY_ITEMS, SURVEY_CATEGORIES, SURVEY_ANSWERS } from "./src/data/items";

interface SurveyResponseItem {
  itemId: number;
  value: number;
}

interface SurveySubmission {
  code: string;
  responses: SurveyResponseItem[];
  emailContext?: string; // Opt-out or customized email destination if needed
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API endpoint to process survey submission
  app.post("/api/submit-survey", async (req, res) => {
    try {
      const { code, responses }: SurveySubmission = req.body;

      if (!code || !responses || !Array.isArray(responses)) {
        return res.status(400).json({ error: "Ungültige Eingabedaten. Teilnahme-Code und Antworten fehlen." });
      }

      if (responses.length !== SURVEY_ITEMS.length) {
        return res.status(400).json({ 
          error: `Unvollständige Umfrage. Es müssen alle ${SURVEY_ITEMS.length} Items beantwortet werden.` 
        });
      }

      // Calculate category sum points
      const categoryScores: { [category: string]: number } = {};
      // Initialize with 0
      Object.keys(SURVEY_CATEGORIES).forEach(cat => {
        categoryScores[cat] = 0;
      });

      // Map item IDs to their values for detail logging
      const responseMap = new Map<number, number>();
      responses.forEach(resp => {
        responseMap.set(resp.itemId, resp.value);
        
        // Find corresponding item to sum score
        const item = SURVEY_ITEMS.find(i => i.id === resp.itemId);
        if (item && categoryScores[item.category] !== undefined) {
          categoryScores[item.category] += resp.value;
        }
      });

      // Format details for the email representation
      const timestamp = new Date().toLocaleString("de-CH", { timeZone: "Europe/Zurich" });
      const recipientEmail = "allenspach@zweitsprache.ch";

      // 1. Build Text email body
      let emailText = `DaZ Kompetenz-Umfrage - Ergebnisse\n`;
      emailText += `=====================================\n\n`;
      emailText += `Teilnahme-Code: ${code}\n`;
      emailText += `Datum/Zeit: ${timestamp}\n\n`;
      emailText += `SUMMENPUNKTE PRO KATEGORIE:\n`;
      emailText += `---------------------------\n`;

      Object.entries(SURVEY_CATEGORIES).forEach(([catName, info]) => {
        const score = categoryScores[catName] || 0;
        const percent = Math.round((score / info.maxPoints) * 100);
        emailText += `- ${catName}: ${score} / ${info.maxPoints} Punkte (${percent}%)\n`;
      });
      emailText += `\n`;

      emailText += `DETAILRESULTATE:\n`;
      emailText += `----------------\n`;
      
      // Group items by category in output
      Object.keys(SURVEY_CATEGORIES).forEach(catName => {
        emailText += `\n[Category] ${catName}\n`;
        const catItems = SURVEY_ITEMS.filter(i => i.category === catName);
        catItems.forEach(item => {
          const val = responseMap.get(item.id) ?? 0;
          const ansText = SURVEY_ANSWERS.find(a => a.value === val)?.text || `${val}`;
          emailText += `Item ${item.id}: "${item.text}"\n  Antwort: ${ansText} (${val} Punkte)\n\n`;
        });
      });

      // 2. Build HTML email body with nice, professional styling
      let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #2e3c43; line-height: 1.6; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #0d233a; color: #ffffff; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Zweitsprache Kompetenz-Umfrage</h2>
          <p style="margin: 6px 0 0 0; color: #a4b3c6; font-size: 14px;">Ergebnisprotokoll und Auswertung</p>
        </div>
        
        <div style="padding: 24px; background-color: #fdfdfd;">
          <!-- Meta Grid -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; background-color: #f5f7f8; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; color: #5a6e7f; border-bottom: 1px solid #e1e8ed; width: 40%;">Teilnahme-Code:</td>
              <td style="padding: 12px 16px; font-weight: bold; color: #1a1a1a; border-bottom: 1px solid #e1e8ed; font-family: monospace; font-size: 16px;">${code}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: bold; color: #5a6e7f;">Abschlussdatum/Zeit:</td>
              <td style="padding: 12px 16px; color: #1a1a1a;">${timestamp} (Schweizer Zeit)</td>
            </tr>
          </table>

          <h3 style="border-bottom: 2px solid #0d233a; padding-bottom: 8px; color: #0d233a; margin-top: 0; font-size: 18px;">1. Summenpunkte pro Kategorie</h3>
          <p style="font-size: 13px; color: #6e7a82; margin-top: -4px;">Berechnet anhand der 23 Pflicht-Items (Skala 0 - 3)</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #edf1f3; text-align: left;">
                <th style="padding: 10px 12px; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1;">Kategorie</th>
                <th style="padding: 10px 12px; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1; text-align: right; width: 120px;">Punkte</th>
                <th style="padding: 10px 12px; font-size: 13px; color: #475569; border-bottom: 2px solid #cbd5e1; text-align: right; width: 100px;">Prozentwert</th>
              </tr>
            </thead>
            <tbody>
      `;

      Object.entries(SURVEY_CATEGORIES).forEach(([catName, info]) => {
        const score = categoryScores[catName] || 0;
        const percent = Math.round((score / info.maxPoints) * 100);
        
        // Define color bars elegantly
        let barColor = "#3b82f6"; // default blue
        if (percent < 33) barColor = "#ef4444"; // red
        else if (percent < 66) barColor = "#f59e0b"; // orange
        else barColor = "#10b981"; // green

        emailHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; font-weight: 500; font-size: 14px;">
              ${catName}
              <div style="background-color: #e2e8f0; border-radius: 4px; height: 6px; width: 100%; margin-top: 6px;">
                <div style="background-color: ${barColor}; height: 6px; border-radius: 4px; width: ${percent}%;"></div>
              </div>
            </td>
            <td style="padding: 12px; font-size: 14px; text-align: right; font-weight: bold; white-space: nowrap;">
              ${score} / ${info.maxPoints} pts
            </td>
            <td style="padding: 12px; font-size: 14px; text-align: right; font-weight: bold; color: ${barColor};">
              ${percent}%
            </td>
          </tr>
        `;
      });

      emailHtml += `
            </tbody>
          </table>

          <h3 style="border-bottom: 2px solid #0d233a; padding-bottom: 8px; color: #0d233a; font-size: 18px; margin-top: 32px;">2. Detaillierte Antworten (Randomisiert abgefragt)</h3>
          <p style="font-size: 13px; color: #6e7a82; margin-top: -4px;">Alle 23 Items gruppiert nach thematischen Clustern</p>
      `;

      // Render details grouped by category in HTML
      Object.keys(SURVEY_CATEGORIES).forEach(catName => {
        const score = categoryScores[catName] || 0;
        const info = SURVEY_CATEGORIES[catName as keyof typeof SURVEY_CATEGORIES];
        emailHtml += `
          <div style="margin-top: 20px; background-color: #fafbfc; border-left: 4px solid #0d233a; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: bold; color: #0d233a; font-size: 15px;">${catName}</div>
            <div style="font-size: 12px; color: #5a6e7f;">Teilergebnis: ${score} / ${info.maxPoints} Punkte</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        `;

        const catItems = SURVEY_ITEMS.filter(i => i.category === catName);
        catItems.forEach((item, index) => {
          const val = responseMap.get(item.id) ?? 0;
          const ansText = SURVEY_ANSWERS.find(a => a.value === val)?.text || `${val}`;
          
          let scoreBadgeBg = "#f1f5f9";
          let scoreBadgeColor = "#475569";
          if (val === 3) { scoreBadgeBg = "#d1fae5"; scoreBadgeColor = "#065f46"; }
          else if (val === 2) { scoreBadgeBg = "#eff6ff"; scoreBadgeColor = "#1e40af"; }
          else if (val === 1) { scoreBadgeBg = "#fef3c7"; scoreBadgeColor = "#92400e"; }
          else if (val === 0) { scoreBadgeBg = "#fee2e2"; scoreBadgeColor = "#991b1b"; }

          emailHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 8px; color: #64748b; font-weight: bold; width: 30px; text-align: center;">#${item.id}</td>
              <td style="padding: 10px 8px; color: #1e293b;">${item.text}</td>
              <td style="padding: 10px 8px; text-align: right; width: 140px; white-space: nowrap;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; background-color: ${scoreBadgeBg}; color: ${scoreBadgeColor}; font-weight: bold;">
                  ${ansText} (${val})
                </span>
              </td>
            </tr>
          `;
        });

        emailHtml += `</table>`;
      });

      emailHtml += `
        </div>
        <div style="background-color: #f1f5f9; color: #64748b; padding: 16px; text-align: center; font-size: 11px; border-top: 1px solid #e2e8f0;">
          Diese E-Mail wurde automatisch von der Zweitsprache Kompetenz-Umfrage generiert.<br>
          Empfänger: <a href="mailto:${recipientEmail}" style="color: #0d233a; font-weight: bold; text-decoration: none;">${recipientEmail}</a>
        </div>
      </div>
      `;

      // Configure Nodemailer SMTP
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || "no-reply@zweitsprache.ch";

      const hasSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);

      if (hasSmtpConfigured) {
        console.log(`Versuche E-Mail an ${recipientEmail} via SMTP zu senden...`);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const mailOptions = {
          from: `"Zweitsprache Umfrage" <${smtpFrom}>`,
          to: recipientEmail,
          subject: `DaZ-Umfrage-Resultate: Code ${code}`,
          text: emailText,
          html: emailHtml,
        };

        await transporter.sendMail(mailOptions);
        console.log(`E-Mail erfolgreich am ${timestamp} an ${recipientEmail} versendet!`);
        return res.json({
          success: true,
          sent: true,
          code,
          recipient: recipientEmail,
          scores: categoryScores,
          timestamp
        });
      } else {
        console.warn("SMTP-Server ist nicht in der .env konfiguriert (Verwende Sandbox-Kopie-Modus).");
        // In clean simulation/sandbox fallback mode, log it in the terminal
        console.log("=== SIMULIERTES E-MAIL-PROTOKOLL ===");
        console.log(`EMPFÄNGER: ${recipientEmail}`);
        console.log(`BETREFF: DaZ-Umfrage-Resultate: Code ${code}`);
        console.log(emailText);
        console.log("====================================");

        // Return email contents to front-end to allow elegant copy/paste options inside simulated space
        return res.json({
          success: true,
          sent: false,
          reason: "SMTP_NOT_CONFIGURED",
          code,
          recipient: recipientEmail,
          scores: categoryScores,
          timestamp,
          draft: {
            subject: `DaZ-Umfrage-Resultate: Code ${code}`,
            text: emailText,
            html: emailHtml
          }
        });
      }
    } catch (err: any) {
      console.error("Fehler beim Verarbeiten der Umfrage-Submission:", err);
      return res.status(500).json({ 
        error: "Ein interner Serverfehler ist beim Verarbeiten oder Senden aufgetreten.", 
        details: err?.message || err 
      });
    }
  });

  // Serve static UI files or mount Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Booting Vite Dev Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-Stack Express Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
