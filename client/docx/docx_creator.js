import { base64Str } from "../src/assets/imgInBase64";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";

const defaultFont = "Times New Roman";
const defaultSize = 24;
const BORDER_COLOR = "000000";
const BORDER_SIZE = 8;

const createSignerParagraphs = (selectedSigners = []) => {
  if (!selectedSigners.length) {
    return [];
  }

  return selectedSigners.flatMap((signer) => [
    new Paragraph(""),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: `${signer} ________________________________`,
        }),
      ],
    }),
  ]);
};

const formatDeadline = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toLocaleDateString("ru-RU");

  if (typeof value === "string") {
    const parts = value.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  }

  return String(value);
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const mapRequestToDocxRows = (requestData) => {
  const items = Array.isArray(requestData?.items) ? requestData.items : [];

  return items.map((item, index) => ({
    number: `${index + 1}`,
    title: normalizeText(item?.name),
    units: normalizeText(item?.unit),
    quantity: item?.quantity ?? "",
    plannedDeadline: formatDeadline(item?.deadline),
    actualDeadline: "",
    comment: normalizeText(item?.description),
  }));
};

const createCellBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: BORDER_SIZE, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: BORDER_SIZE, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: BORDER_SIZE, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: BORDER_SIZE, color: BORDER_COLOR },
});

const createCell = (text, options = {}) =>
  new TableCell({
    width: options.width,
    verticalAlign: options.verticalAlign ?? VerticalAlign.CENTER,
    margins: {
      top: 70,
      bottom: 70,
      left: 70,
      right: 70,
    },
    borders: createCellBorders(),
    children: [
      new Paragraph({
        alignment: options.alignment ?? AlignmentType.CENTER,
        spacing: {
          before: 0,
          after: 0,
          line: 276,
        },
        children: [
          new TextRun({
            text: text ?? "",
            bold: options.bold ?? false,
            size: options.size ?? 22,
          }),
        ],
      }),
    ],
  });

export const docxCreator = (requestData, selectedSigners = []) => {
  const rows = mapRequestToDocxRows(requestData);
  const signerParagraphs = createSignerParagraphs(selectedSigners);
  const purchasePurpose = normalizeText(requestData?.comment);

  const table = new Table({
    width: {
      size: 10800,
      type: WidthType.DXA,
    },
    columnWidths: [500, 3000, 700, 700, 1700, 1700, 2500],
    rows: [
      new TableRow({
        children: [
          createCell("№", { bold: false, size: 20 }),
          createCell("Наименование", {
            bold: false,
            size: 20,
          }),
          createCell("Ед", { bold: false, size: 20 }),
          createCell("Колл", { bold: false, size: 20 }),
          createCell("Планируемый срок приобретения", {
            bold: false,
            size: 20,
          }),
          createCell("Фактический срок приобретения", {
            bold: false,
            size: 20,
          }),
          createCell("Комментарий", {
            bold: false,
            size: 20,
          }),
        ],
      }),
      ...rows.map((row) =>
        new TableRow({
          children: [
            createCell(row.number),
            createCell(row.title, {
              alignment: AlignmentType.LEFT,
            }),
            createCell(row.units),
            createCell(String(row.quantity ?? "")),
            createCell(row.plannedDeadline),
            createCell(row.actualDeadline),
            createCell(row.comment, {
              alignment: AlignmentType.LEFT,
            }),
          ],
        })
      ),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: defaultSize,
            font: defaultFont,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 432,
              right: 600,
              bottom: 288,
              left: 600,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 120,
            },
            children: [
              new ImageRun({
                data: base64Str,
                transformation: {
                  width: 672,
                  height: 120,
                },
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 0,
            },
            children: [
              new TextRun({ text: "          __________          _______________          " }),
              new TextRun({
                text: "В РАБОТУ",
                bold: true,
                italics: true,
              }),
              new TextRun({ text: " __________________/___________/" }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 80,
            },
            children: [
              new TextRun({
                text: "             (дата)                  (стр. подразделение)                              (кому)",
                size: 18,
              }),
            ],
          }),

          new Paragraph(""),

          new Paragraph({
            indent: {
              left: 7200,
            },
            children: [
              new TextRun({
                break: 1,
                text: "Генеральному директору",
              }),
              new TextRun({
                break: 1,
                text: "ООО «Уралшина»",
              }),
              new TextRun({
                break: 1,
                text: "Мустаеву М.Г.",
              }),
            ],
          }),

          new Paragraph(""),
          new Paragraph(""),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
            children: [
              new TextRun({
                text: "СЛУЖЕБНАЯ ЗАПИСКА",
                bold: true,
              }),
            ],
          }),

          new Paragraph({
            spacing: {
              after: 180,
            },
            children: [
              new TextRun({
                text: "Цель покупки: ",
                bold: true,
              }),
              new TextRun({
                text: purchasePurpose || "—",
              }),
            ],
          }),

          table,

          new Paragraph(""),
          new Paragraph(""),

          ...signerParagraphs,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    const fileName = requestData?.id
      ? `zayavka-${requestData.id}.docx`
      : "zayavka.docx";

    saveAs(blob, fileName);
    console.log("Document created successfully");
  });
};