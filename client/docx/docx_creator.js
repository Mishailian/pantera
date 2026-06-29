import { shapkaHeaderBase64, shapkaFooterBase64 } from "../src/assets/shapkaBase64";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TabStopType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

const DOCX_CONFIG = {
  font: { family: "Times New Roman", defaultSize: 28, smallSize: 18, titleSize: 40 },
  page: { width: 11906, height: 16838, marginTop: 432, marginRight: 600, marginBottom: 288, marginLeft: 600 },
  header: { logoWidth: 714, logoHeight: 114, afterLogoSpacing: 120, topLabelsAfterSpacing: 80, receiverIndentLeft: 7200, rightTabPosition: 10000 },
  footer: { imgWidth: 714, imgHeight: 96 },
  title: { text: "СЛУЖЕБНАЯ ЗАПИСКА", afterSpacing: 200 },
  purpose: { label: "Цель покупки: ", afterSpacing: 180 },
  requestNumber: { prefix: "", beforeSpacing: 180, afterSpacing: 120 },
  table: { width: 10700, columnWidths: [500, 2900, 700, 700, 1550, 1550, 2800], borderColor: "000000", borderSize: 12, cellMarginTop: 70, cellMarginBottom: 70, cellMarginLeft: 70, cellMarginRight: 70, lineSpacing: 276, headerFontSize: 22, bodyFontSize: 24, headers: ["№", "Наименование", "Ед.", "Кол-во", "Планируемый срок приобретения", "Фактический срок приобретения", "Комментарий"] },
  signers: { lineText: "_______________________________", gapBeforeFirst: 240, gapBetween: 500 },
};

const normalizeText = (value) => value === null || value === undefined ? "" : String(value).trim();
const formatDeadline = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toLocaleDateString("ru-RU");
  if (typeof value === "string") {
    const parts = value.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return String(value);
};
const mapRequestToDocxRows = (requestData) => (Array.isArray(requestData?.items) ? requestData.items : []).map((item, index) => ({ number: String(index + 1), title: normalizeText(item?.name), units: normalizeText(item?.unit), quantity: item?.quantity ?? "", plannedDeadline: formatDeadline(item?.deadline), actualDeadline: "", comment: normalizeText(item?.description) }));
const createBorders = () => ({ top: { style: BorderStyle.SINGLE, size: DOCX_CONFIG.table.borderSize, color: DOCX_CONFIG.table.borderColor }, bottom: { style: BorderStyle.SINGLE, size: DOCX_CONFIG.table.borderSize, color: DOCX_CONFIG.table.borderColor }, left: { style: BorderStyle.SINGLE, size: DOCX_CONFIG.table.borderSize, color: DOCX_CONFIG.table.borderColor }, right: { style: BorderStyle.SINGLE, size: DOCX_CONFIG.table.borderSize, color: DOCX_CONFIG.table.borderColor } });
const createCell = (text, options = {}) => new TableCell({ width: { size: options.width ?? 1000, type: WidthType.DXA }, verticalAlign: options.verticalAlign ?? VerticalAlign.CENTER, margins: { top: DOCX_CONFIG.table.cellMarginTop, bottom: DOCX_CONFIG.table.cellMarginBottom, left: DOCX_CONFIG.table.cellMarginLeft, right: DOCX_CONFIG.table.cellMarginRight }, borders: createBorders(), children: [new Paragraph({ alignment: options.alignment ?? AlignmentType.CENTER, spacing: { before: 0, after: 0, line: DOCX_CONFIG.table.lineSpacing }, children: [new TextRun({ text: text ?? "", bold: options.bold ?? false, size: options.size ?? DOCX_CONFIG.table.bodyFontSize })] })] });
const createSignerParagraphs = (selectedSigners = []) => { if (!selectedSigners.length) return []; return selectedSigners.map((signer, index) => new Paragraph({ spacing: { before: index === 0 ? DOCX_CONFIG.signers.gapBeforeFirst : DOCX_CONFIG.signers.gapBetween }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: `${signer} ${DOCX_CONFIG.signers.lineText}` })] })); };
const createTopHeaderParagraphs = (creationDate = "", departmentLabel = "") => [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: DOCX_CONFIG.header.afterLogoSpacing }, children: [new ImageRun({ data: shapkaHeaderBase64, transformation: { width: DOCX_CONFIG.header.logoWidth, height: DOCX_CONFIG.header.logoHeight } })] }), new Paragraph({ spacing: { after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: DOCX_CONFIG.header.rightTabPosition }], children: [new TextRun({ text: creationDate || "_____________" }), new TextRun({ text: "	В РАБОТУ _____________/___________/", bold: true, italics: true })] }), new Paragraph({ spacing: { after: 40 }, tabStops: [{ type: TabStopType.RIGHT, position: DOCX_CONFIG.header.rightTabPosition }], children: [new TextRun({ text: "(дата)", size: DOCX_CONFIG.font.smallSize }), new TextRun({ text: "	(кому)", size: DOCX_CONFIG.font.smallSize })] }), new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: departmentLabel || "_____________________" })] }), new Paragraph({ spacing: { after: DOCX_CONFIG.header.topLabelsAfterSpacing }, children: [new TextRun({ text: "(стр. подразделение)", size: DOCX_CONFIG.font.smallSize })] }), new Paragraph(""), new Paragraph({ indent: { left: DOCX_CONFIG.header.receiverIndentLeft }, children: [new TextRun({ break: 1, text: "Генеральному директору" }), new TextRun({ break: 1, text: "ООО «Уралшина»" }), new TextRun({ break: 1, text: "Мустаеву М.Г." })] }), new Paragraph(""), new Paragraph("")];
const createRequestTable = (rows) => new Table({ width: { size: DOCX_CONFIG.table.width, type: WidthType.DXA }, layout: "fixed", columnWidths: DOCX_CONFIG.table.columnWidths, rows: [new TableRow({ children: DOCX_CONFIG.table.headers.map((header, index) => createCell(header, { bold: false, size: DOCX_CONFIG.table.headerFontSize, width: DOCX_CONFIG.table.columnWidths[index] })) }), ...rows.map((row) => new TableRow({ children: [createCell(row.number, { width: DOCX_CONFIG.table.columnWidths[0] }), createCell(row.title, { alignment: AlignmentType.LEFT, width: DOCX_CONFIG.table.columnWidths[1] }), createCell(row.units, { width: DOCX_CONFIG.table.columnWidths[2] }), createCell(String(row.quantity ?? ""), { width: DOCX_CONFIG.table.columnWidths[3] }), createCell(row.plannedDeadline, { width: DOCX_CONFIG.table.columnWidths[4] }), createCell(row.actualDeadline, { width: DOCX_CONFIG.table.columnWidths[5] }), createCell(row.comment, { alignment: AlignmentType.LEFT, width: DOCX_CONFIG.table.columnWidths[6] })] }))] });
const createFooterParagraph = () => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new ImageRun({ data: shapkaFooterBase64, transformation: { width: DOCX_CONFIG.footer.imgWidth, height: DOCX_CONFIG.footer.imgHeight } })] });
export const docxCreator = (requestData, selectedSigners = []) => {
  const rows = mapRequestToDocxRows(requestData);
  const signerParagraphs = createSignerParagraphs(selectedSigners);
  const purchasePurpose = normalizeText(requestData?.comment) || "—";
  const requestNumber = requestData?.id ?? "—";
  const creationDate = normalizeText(requestData?.created_at_formatted).split(" ")[0];
  const departmentLabel = normalizeText(requestData?.created_by_user?.role_label);
  const doc = new Document({
    styles: { default: { document: { run: { size: DOCX_CONFIG.font.defaultSize, font: DOCX_CONFIG.font.family } } } },
    sections: [{
      properties: { page: { size: { width: DOCX_CONFIG.page.width, height: DOCX_CONFIG.page.height }, margin: { top: DOCX_CONFIG.page.marginTop, right: DOCX_CONFIG.page.marginRight, bottom: DOCX_CONFIG.page.marginBottom, left: DOCX_CONFIG.page.marginLeft } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `${DOCX_CONFIG.requestNumber.prefix}${requestNumber}`, bold: false, size: DOCX_CONFIG.font.defaultSize })] }),
        ...createTopHeaderParagraphs(creationDate, departmentLabel),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: DOCX_CONFIG.title.afterSpacing }, children: [new TextRun({ text: DOCX_CONFIG.title.text, bold: true, size: DOCX_CONFIG.font.titleSize })] }),
        new Paragraph({ spacing: { after: DOCX_CONFIG.purpose.afterSpacing }, children: [new TextRun({ text: DOCX_CONFIG.purpose.label, bold: true }), new TextRun({ text: purchasePurpose })] }),
        createRequestTable(rows),
        ...signerParagraphs,
        createFooterParagraph(),
      ],
    }],
  });
  Packer.toBlob(doc).then((blob) => { saveAs(blob, requestData?.id ? `zayavka-${requestData.id}.docx` : "zayavka.docx"); });
};
