declare global {
  interface Window {
    mammoth: { extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
    pdfjsLib: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (opts: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getTextContent: () => Promise<{
              items: { str: string }[];
            }>;
          }>;
        }>;
      };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (["txt", "md", "csv"].includes(extension)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (extension === "docx") {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
    );
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (extension === "pdf") {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    );
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return text;
  }

  throw new Error("非対応のファイル形式です");
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
  backoff = 1000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}
