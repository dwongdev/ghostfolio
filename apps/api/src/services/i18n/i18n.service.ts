import { DEFAULT_LANGUAGE_CODE } from '@ghostfolio/common/config';

import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class I18nService {
  private localesPath = join(__dirname, 'assets', 'locales');
  private translations: { [locale: string]: cheerio.CheerioAPI } = {};

  public constructor() {
    this.loadFiles();
  }

  public getTranslation({
    id,
    languageCode,
    placeholders
  }: {
    id: string;
    languageCode: string;
    placeholders?: Record<string, string | number>;
  }): string {
    const $ = this.translations[languageCode];

    if (!$) {
      Logger.warn(`Translation not found for locale '${languageCode}'`);
    }

    let translatedText = $(
      `trans-unit[id="${id}"] > ${
        languageCode === DEFAULT_LANGUAGE_CODE ? 'source' : 'target'
      }`
    ).text();

    if (!translatedText) {
      Logger.warn(
        `Translation not found for id '${id}' in locale '${languageCode}'`
      );
    }

    if (placeholders) {
      for (const [key, value] of Object.entries(placeholders)) {
        translatedText = translatedText.replace(`\${${key}}`, String(value));
      }
    }

    return translatedText.trim();
  }

  private loadFiles() {
    try {
      const files = readdirSync(this.localesPath, 'utf-8');

      for (const file of files) {
        const xmlData = readFileSync(join(this.localesPath, file), 'utf8');
        this.translations[this.parseLanguageCode(file)] =
          this.parseXml(xmlData);
      }
    } catch (error) {
      Logger.error(error, 'I18nService');
    }
  }

  private parseLanguageCode(aFileName: string) {
    const match = aFileName.match(/\.([a-zA-Z]+)\.xlf$/);

    return match ? match[1] : DEFAULT_LANGUAGE_CODE;
  }

  private parseXml(xmlData: string): cheerio.CheerioAPI {
    return cheerio.load(xmlData, { xmlMode: true });
  }
}
