import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

export async function POST(req: Request) {
  try {
    const {
      title,
      content,
    }: {
      title: string;
      content: string;
    } = await req.json();

    if (!title || !content) {
      return Response.json(
        { error: "title and content required" },
        { status: 400 }
      );
    }

    const paragraphs: Paragraph[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32, // 16pt
          }),
        ],
      })
    );

    // Body: split by lines, preserving empty lines as blank paragraphs
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.trim() === "") {
        paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
      } else {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: line,
                size: 22, // 11pt
              }),
            ],
          })
        );
      }
    }

    // Footer note
    paragraphs.push(
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: "※本書面は LegalTwin により生成されたドラフトです。弁護士による最終確認が必要です。",
            size: 16,
            italics: true,
            color: "888888",
          }),
        ],
      })
    );

    const doc = new Document({
      creator: "LegalTwin",
      title: title,
      description: "LegalTwin generated legal document",
      sections: [{ properties: {}, children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX export error:", error);
    return Response.json({ error: "Failed to generate docx" }, { status: 500 });
  }
}
