import markdownit from 'markdown-it';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItContainer from 'markdown-it-container';
import markdownItTableOfContents from 'markdown-it-table-of-contents';
import puppeteer from 'puppeteer';
import { createId } from '@paralleldrive/cuid2';
import { prepareReportData } from './report-data-handlers';

const isCli = process.env.SHELL != null && process.env.SHELL.trim() !== '';
export enum ReportType {
  MWI = 'mwi',
}
export enum ReportOutput {
  HTML = 'html',
  PDF = 'pdf',
}
export type Report = {
  type: ReportType;
  output: ReportOutput;
  data: any;
};

export function generateReport(report: Report): TE.TaskEither<Error, string> {
  console.log('SHELL:', process.env.SHELL);
  switch (report.type) {
    case ReportType.MWI:
      return generateMWIReport(report);
    default:
      return TE.left(new Error('Wrong report type.'));
  }
}

function generateMWIReport(report: Report): TE.TaskEither<Error, string> {
  switch (report.output) {
    case ReportOutput.HTML:
      return generateMWIHtmlReport(report);
    case ReportOutput.PDF:
      return generateMWIPdfReport(report);
    default:
      return TE.left(new Error('Wrong report output format.'));
  }
}

function generateMWIPdfReport(report: Report): TE.TaskEither<Error, string> {
  const baseDir = isCli ? '../../../src' : '../..';
  const templateFile = `${__dirname}/${baseDir}/templates/reports/mwi-pdf.md`;
  const cssFile = `${__dirname}/${baseDir}/templates/reports/css/mwi-pdf.css`;
  return pipe(
    generateReportHTML(report, templateFile, cssFile),
    TE.chain((html) => generatePDF(html)),
  );
}

function generateMWIHtmlReport(report: Report): TE.TaskEither<Error, string> {
  const baseDir = isCli ? '../../../src' : '../..';
  const templateFile = `${__dirname}/${baseDir}/templates/reports/mwi-html.md`;
  const cssFile = `${__dirname}/${baseDir}/templates/reports/css/mwi-html.css`;
  return pipe(
    generateReportHTML(report, templateFile, cssFile),
    TE.flatMap((htmlContent) => saveDataToFile(htmlContent)),
  );
}

function generateReportHTML(report: Report, templateFile: string, cssFile: string): TE.TaskEither<Error, string> {
  return pipe(
    TE.tryCatch(
      async () => await fs.readFile(templateFile, 'utf8'),
      (_: unknown) => new Error(`Could not read template file: ${templateFile}`),
    ),
    TE.chain((template) =>
      pipe(
        prepareReportData(report),
        TE.map<string, [string, any]>((data) => [template, data]),
      ),
    ),
    TE.map((templateWithData) => compileTemplate(templateWithData[0], templateWithData[1])),
    TE.map((compiledTemplate: string) => generateHTML(compiledTemplate)),
    TE.chain((html) =>
      pipe(
        TE.tryCatch(
          async () => await fs.readFile(cssFile, 'utf8'),
          (_: unknown) => new Error(`Could not read css file: ${cssFile}`),
        ),
        TE.map((cssContent) => {
          return `<!DOCTYPE html>
        <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width">
              <title>MWI Report</title>
              <link href='https://fonts.googleapis.com/css?family=Source Sans 3' rel='stylesheet'>
              <style>${cssContent}</style>
          </head>
          <body>
            <main>
              ${html}
            </main>
          </body>
        </html>`;
        }),
      ),
    ),
  );
}

function saveDataToFile(htmlContent: string): TE.TaskEither<Error, string> {
  return pipe(
    TE.tryCatch(
      async () => {
        const tempDirectory = await fs.mkdtemp('html-generated-');
        return `${tempDirectory}/${createId()}.html`;
      },
      (_: unknown) => new Error('Could not create temporary directory.'),
    ),
    TE.flatMap((filePath) =>
      pipe(
        TE.tryCatch(
          async () => await fs.writeFile(filePath, htmlContent),
          (_: unknown) => new Error(`Could not write file: ${filePath}`),
        ),
        TE.map((_) => filePath),
      ),
    ),
  );
}

function compileTemplate(templateContent: string, data?: Record<string, string | number>): string {
  return handlebars.compile(templateContent)(data);
}

function generateHTML(markdownContent: string): string {
  const markdown = markdownit({
    html: true,
    linkify: true,
    typographer: true,
  })
    .use(markdownItAnchor)
    .use(markdownItTableOfContents)
    .use(markdownItAttrs)
    .use(markdownItContainer, 'container', {
      render: (tokens: { nesting: number; info: string }[], idx: number) => {
        const token = tokens[idx];
        if (token.nesting === 1) {
          const info = token.info.trim().split(' ');
          const className = info[1];
          return `<div class="${className}">\n`;
        } else {
          return '</div>\n';
        }
      },
    });
  return markdown.render(markdownContent);
}

function generatePDF(htmlContent: string): TE.TaskEither<Error, string> {
  return pipe(
    TE.tryCatch(
      async () => {
        const tempDirectory = await fs.mkdtemp('pdf-generated-');
        return `${tempDirectory}/${createId()}.pdf`;
      },
      (_: unknown) => new Error('Could not create temporary directory.'),
    ),
    TE.flatMap((outputFile) =>
      pipe(
        TE.tryCatch(
          async () => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(htmlContent);
            await page.pdf({ path: outputFile, format: 'A4' });
            await browser.close();

            return outputFile;
          },
          (_: unknown) => new Error('Could not creeate PDF.'),
        ),
      ),
    ),
  );
}
