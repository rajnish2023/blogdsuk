const { htmlRows, htmlList, esc, titleCase } = require("./mailPortal");
const { fmt } = require("./licensingEngine");

const APP_LABEL = { finance: "Finance", scm: "Supply Chain", commerce: "Commerce", hr: "HR" };

const statementHtml = (model) => {
  const rows = (model.lines || [])
    .map(
      (l) => `
        <tr>
            <td style='padding:10px;border:1px solid #ddd;'>${l.qty} &times; ${esc(l.label)}<br><span style='color:#777;font-size:12px;'>${esc(
        l.sub || ""
      )}</span></td>
            <td style='padding:10px;border:1px solid #ddd;text-align:right;'>${esc(model.symbol)}${fmt(l.total)}</td>
        </tr>
    `
    )
    .join("");

  return `
     <table style='width:100%;border-collapse:collapse;table-layout:fixed;'>
    <colgroup>
        <col style='width:50%;'>
        <col style='width:50%;'>
    </colgroup>
    ${rows || `<tr><td colspan='2' style='padding:10px;border:1px solid #ddd;color:#777;'>No user lines.</td></tr>`}
</table>
   `;
};

/* What the visitor ticked, grouped, in the same bordered-table style. */
const capabilitiesHtml = (details = []) => {
  if (!details.length) {
    return "<table style='width:100%;border-collapse:collapse;'><tr><td style='padding:10px;border:1px solid #ddd;color:#777;'>None selected</td></tr></table>";
  }
  const byGroup = details.reduce((acc, c) => {
    (acc[c.group || "Other"] ||= []).push(c);
    return acc;
  }, {});
  const rows = Object.entries(byGroup)
    .map(
      ([group, items]) => `
        <tr>
            <td style='padding:10px;border:1px solid #ddd;vertical-align:top;'>${esc(group)}</td>
            <td style='padding:10px;border:1px solid #ddd;'>${items.map((i) => esc(i.label)).join("<br>")}</td>
        </tr>
    `
    )
    .join("");
  return `
     <table style='width:100%;border-collapse:collapse;table-layout:fixed;'>
    <colgroup>
        <col style='width:50%;'>
        <col style='width:50%;'>
    </colgroup>
    ${rows}
</table>
   `;
};

const buildLicensingMailFields = ({ lead, model, details = [], source, internalTo }) => {
  const money = (n) => `${fmt(Number(n || 0))}`;

  const modules = (model.beyondDrivers || [])
    .filter((d) => d.fo)
    .map((d) => `${d.fo}${d.app ? ` — ${APP_LABEL[d.app] || d.app}` : ""}`);

  const pricingNote = model.pricingTrusted
    ? `List prices verified ${model.pricingVerified}.`
    : "List prices are placeholders pending verification.";

  const displayName = titleCase(lead.name);

  const common = {
    name: displayName,
    phone: lead.phone || "",
    company: lead.company || "",
    // `email` carries the recipient, so the visitor rides along here
    customerEmail: lead.email,
    platformLabel: model.platformLabel,
    currencyName: model.symbol,
    currencyCode: model.currency,
    monthlyTotal: money(model.monthly),
    annualTotal: money(model.annual),
    threeYearTotal: money(model.threeYear),
    capabilitiesData: capabilitiesHtml(details),
    modulesData: htmlList(modules),
    extensionsData: htmlList((model.extensions || []).map((e) => e.label)),
    pricingNote,
    renewal: lead.renewal || "",
    reference: String(lead._id),
    submittedAt: new Date(lead.createdAt || Date.now()).toUTCString(),
  };

  return {
    internal: {
      ...common,
      customerEmail: lead.email,
      title: `New licence enquiry — ${displayName}${lead.company ? ` (${lead.company})` : ""}`,
      statementData: statementHtml(model),
      contactData: htmlRows([
        ["Name", esc(displayName)],
        ["Email", `<a href="mailto:${esc(lead.email)}" style="color:#2563eb;">${esc(lead.email)}</a>`],
        ["Phone", lead.phone ? `<a href="tel:${esc(lead.phone)}" style="color:#2563eb;">${esc(lead.phone)}</a>` : ""],
        ["Company", esc(lead.company)],
        ["Renewal", esc(lead.renewal)],
      ]),
      shapeData: htmlRows([
        ["Full users", lead.fullUsers],
        ["Team Members", lead.teamUsers],
        ["Device", lead.deviceUsers],
        ["Operations Activity", lead.activityUsers || 0],
        ["Legal entities", lead.entities],
        ["Countries", lead.countries],
        ["Revenue band", esc(lead.revenueBand)],
      ]),
      source: esc(source || lead.source || "licence-rate-card"),
    },
    customer: {
      ...common,
      email: lead.email,
      to: lead.email,
      recipient: lead.email,
      recipients: lead.email,
      toEmail: lead.email,
      sendTo: lead.email,
      title: "Your Dynamics 365 licence estimate",
      statementData: statementHtml(model),
    },
  };
};

module.exports = { buildLicensingMailFields, statementHtml, capabilitiesHtml };
