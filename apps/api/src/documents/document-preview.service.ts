import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { StorageService } from '../storage/storage.service';

const HTML_WRAPPER = (body: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 2cm; color: #111; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ccc; padding: 6px; }
    img { max-width: 100%; height: auto; }
    h1, h2, h3 { margin-top: 1.2em; }
    p { margin: 0.5em 0; }
  </style>
</head>
<body>${body}</body>
</html>`;

@Injectable()
export class DocumentPreviewService {
  private readonly logger = new Logger(DocumentPreviewService.name);

  constructor(private readonly storage: StorageService) {}

  getPreviewPdfPath(fileKey: string): string {
    return this.storage.getFilePath(`${fileKey}.preview.pdf`);
  }

  async ensurePreviewPdf(fileKey: string, fileType: string): Promise<string> {
    if (fileType === 'pdf') {
      if (!this.storage.fileExists(fileKey)) {
        throw new BadRequestException('Archivo PDF no encontrado');
      }
      return this.storage.getFilePath(fileKey);
    }

    if (fileType !== 'docx') {
      throw new BadRequestException('Tipo de archivo no soportado para vista previa PDF');
    }

    if (!this.storage.fileExists(fileKey)) {
      throw new BadRequestException('Archivo DOCX no encontrado');
    }

    const sourcePath = this.storage.getFilePath(fileKey);
    const previewPath = this.getPreviewPdfPath(fileKey);

    const sourceMtime = fs.statSync(sourcePath).mtimeMs;
    if (fs.existsSync(previewPath)) {
      const previewMtime = fs.statSync(previewPath).mtimeMs;
      if (previewMtime >= sourceMtime) {
        return previewPath;
      }
    }

    await this.convertDocxToPdf(sourcePath, previewPath);
    return previewPath;
  }

  private async convertDocxToPdf(sourcePath: string, outputPath: string): Promise<void> {
    const buffer = await fs.promises.readFile(sourcePath);
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const fullHtml = HTML_WRAPPER(html);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      });
      await fs.promises.writeFile(outputPath, pdfBuffer);
    } catch (err) {
      this.logger.error('Error al convertir DOCX a PDF', err);
      throw new BadRequestException('No se pudo generar la vista previa PDF del documento');
    } finally {
      if (browser) await browser.close();
    }
  }

  async htmlToPdfBuffer(html: string): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      return Buffer.from(
        await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' },
        }),
      );
    } catch (err) {
      this.logger.error('Error al generar PDF desde HTML', err);
      throw new BadRequestException('No se pudo generar el PDF del acta');
    } finally {
      if (browser) await browser.close();
    }
  }
}
