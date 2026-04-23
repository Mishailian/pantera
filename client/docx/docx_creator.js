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
} from "docx";
import { saveAs } from "file-saver";

const defaultFont = "Times New Roman";
const defaultSize = 24;

const createSignerParagraphs = (selectedSigners = []) => {
  if (!selectedSigners.length) {
    return [
      new Paragraph(""),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        text: "",
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: "________________________",
          }),
        ],
      }),
      new Paragraph(""),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        text: "",
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: "________________________",
          }),
        ],
      }),
    ];
  }

  return selectedSigners.flatMap((signer) => [
    new Paragraph(""),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      text: "",
    }),
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

export const docxCreator = (data, selectedSigners = []) => {
  const tableCreator = (
    state,
    { columnWidths, cellWidth, headers, content }
  ) => {
    const cellCreator = (object) => {
      if (object instanceof Date) object = object.toLocaleDateString();

      return new TableCell({
        width: cellWidth,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            text: `${object ?? ""}`,
          }),
        ],
      });
    };

    const headerCreator = () => {
      return new TableRow({
        children: headers.map((el) => cellCreator(el)),
      });
    };

    const rowCreator = () => {
      const rows = [];

      for (const [key, value] of Object.entries(state)) {
        const contentOfCurrentRow = content.map((field) =>
          cellCreator(value[field])
        );

        rows.push(
          new TableRow({
            children: [cellCreator(key), ...contentOfCurrentRow],
          })
        );
      }

      return rows;
    };

    return new Table({
      columnWidths,
      rows: [headerCreator(), ...rowCreator()],
    });
  };

  const table = tableCreator(data, {
    columnWidths: [444, 4500, 1407, 1407, 2420],
    cellWidth: {
      size: 3505,
      type: WidthType.AUTO,
    },
    headers: [
      "\u2116",
      "Наименование",
      "Ед",
      "Колл",
      "Планируемый срок приобретения",
    ],
    content: ["title", "units", "quantity", "deadline"],
  });

  const signerParagraphs = createSignerParagraphs(selectedSigners);

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
              right: 864,
              bottom: 288,
              left: 864,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
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

          new Paragraph("             __________        _______________ "),

          new Paragraph({
            children: [
              new TextRun({
                text: "                        (дата)                      (стр. подразделение)",
                size: 18,
              }),
              new TextRun({
                text: "\t\t     В РАБОТУ ",
                bold: true,
                italics: true,
              }),
              new TextRun({
                text: "_________________/___________/",
              }),
            ],
          }),

          new Paragraph({
            indent: {
              left: 7605,
            },
            children: [
              new TextRun({
                size: 18,
                text: "(кому)",
              }),
            ],
          }),

          new Paragraph(""),

          new Paragraph({
            indent: {
              left: 6205,
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
                text: "Мустаеву М.Г. ",
              }),
            ],
          }),

          new Paragraph(""),
          new Paragraph(""),
          new Paragraph(""),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: 100,
            children: [
              new TextRun({
                text: "СЛУЖЕБНАЯ ЗАПИСКА",
                bold: true,
              }),
            ],
          }),

          new Paragraph(""),
          new Paragraph(""),
          table,
          new Paragraph(""),

          new Paragraph({
            text: ":                                                       ____________________________",
          }),

          new Paragraph(""),
          new Paragraph(""),
          new Paragraph(""),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            text: "_______________________ ",
          }),

          new Paragraph(""),
          new Paragraph(""),

          ...signerParagraphs,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "example.docx");
    console.log("Document created successfully");
  });
};